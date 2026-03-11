import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Doctor } from '../database/models/doctor.model.js';
import { User } from '../database/models/user.model.js';
import { Specialization } from '../database/models/specialization.model.js';
import { Hospital } from '../database/models/hospital.model.js';
import { DoctorSpecialization } from '../database/models/doctor-specialization.model.js';

export interface SearchResult {
  doctors: Doctor[];
  hospitals: Hospital[];
  articles: { id: string; title: string; category: string; excerpt: string; image?: string }[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Specialization) private readonly specializationModel: typeof Specialization,
    @InjectModel(Hospital) private readonly hospitalModel: typeof Hospital,
    @InjectModel(DoctorSpecialization) private readonly doctorSpecModel: typeof DoctorSpecialization,
  ) {}

  async search(q: string, options?: { doctorsLimit?: number; hospitalsLimit?: number }): Promise<SearchResult> {
    const term = (q || '').trim();
    const limitDoctors = options?.doctorsLimit ?? 10;
    const limitHospitals = options?.hospitalsLimit ?? 10;

    const [doctors, hospitals, articles] = await Promise.all([
      term ? this.searchDoctors(term, limitDoctors) : Promise.resolve([]),
      term ? this.searchHospitals(term, limitHospitals) : Promise.resolve([]),
      term ? this.searchArticles(term) : Promise.resolve([]),
    ]);

    return { doctors, hospitals, articles };
  }

  private async searchDoctors(term: string, limit: number): Promise<Doctor[]> {
    const like = { [Op.like]: `%${term}%` };
    const users = await this.userModel.findAll({
      attributes: ['id'],
      where: { [Op.or]: [{ firstName: like }, { lastName: like }] },
    });
    const userIds = users.map((u) => u.id);
    const specIds = (await this.specializationModel.findAll({ attributes: ['id'], where: { name: like } })).map((s) => s.id);
    const doctorIdsByUser = userIds.length
      ? (await this.doctorModel.findAll({ attributes: ['id'], where: { userId: { [Op.in]: userIds } } })).map((d) => d.id)
      : [];
    const doctorIdsBySpec: number[] = [];
    if (specIds.length) {
      const links = await this.doctorSpecModel.findAll({ where: { specializationId: { [Op.in]: specIds } }, attributes: ['doctorId'] });
      doctorIdsBySpec.push(...[...new Set(links.map((l) => l.doctorId))]);
    }
    const allIds = [...new Set([...doctorIdsByUser, ...doctorIdsBySpec])];
    if (allIds.length === 0) return [];
    return this.doctorModel.findAll({
      where: { id: { [Op.in]: allIds } },
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: Specialization, through: { attributes: [] } },
      ],
      limit,
      order: [['averageRating', 'DESC']],
    });
  }

  private async searchHospitals(term: string, limit: number): Promise<Hospital[]> {
    const like = { [Op.like]: `%${term}%` };
    return this.hospitalModel.findAll({
      where: {
        isActive: true,
        [Op.or]: [{ name: like }, { address: like }, { description: like }],
      },
      limit,
      order: [['name', 'ASC']],
    });
  }

  private async searchArticles(term: string): Promise<{ id: string; title: string; category: string; excerpt: string; image?: string }[]> {
    const lower = term.toLowerCase();
    const mockArticles = [
      { id: '1', title: '10 Simple Ways to Keep Your Heart Healthy After 40', category: 'Heart Health', excerpt: 'Learn the best dietary and lifestyle changes to support cardiovascular health.', image: undefined },
      { id: '2', title: 'Understanding the Link Between Cardio and Longevity', category: 'Exercise', excerpt: 'Recent studies suggest that moderate cardio can improve longevity.', image: undefined },
      { id: '3', title: 'When to See a Cardiologist', category: 'Heart Health', excerpt: 'Signs and symptoms that warrant a specialist visit.', image: undefined },
      { id: '4', title: 'Managing Blood Pressure at Home', category: 'Heart Health', excerpt: 'Tips for monitoring and managing your blood pressure.', image: undefined },
    ];
    return mockArticles.filter(
      (a) => a.title.toLowerCase().includes(lower) || a.category.toLowerCase().includes(lower) || a.excerpt.toLowerCase().includes(lower),
    );
  }
}
