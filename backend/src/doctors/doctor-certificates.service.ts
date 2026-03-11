import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  DoctorCertificate,
  DoctorCertificateType,
  DOCTOR_CERTIFICATE_TYPES,
} from '../database/models/doctor-certificate.model.js';
import { Doctor } from '../database/models/doctor.model.js';

@Injectable()
export class DoctorCertificatesService {
  constructor(
    @InjectModel(DoctorCertificate) private readonly certificateModel: typeof DoctorCertificate,
    @InjectModel(Doctor) private readonly doctorModel: typeof Doctor,
  ) { }

  async getDoctorIdByUserId(userId: number): Promise<number> {
    const doctor = await this.doctorModel.findOne({ where: { userId }, attributes: ['id'] });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor.id;
  }

  async listByDoctorId(doctorId: number) {
    const list = await this.certificateModel.findAll({
      where: { doctorId },
      order: [['type', 'ASC']],
    });
    return { certificates: list };
  }

  async upsert(doctorId: number, type: DoctorCertificateType, fileUrl: string) {
    const [cert] = await this.certificateModel.findOrCreate({
      where: { doctorId, type },
      defaults: { doctorId, type, fileUrl, status: 'uploaded' },
    });
    if (cert.fileUrl !== fileUrl || cert.status !== 'uploaded') {
      await cert.update({ fileUrl, status: 'uploaded' });
    }
    return cert;
  }

  async deleteCertificate(doctorId: number, id: number) {
    const cert = await this.certificateModel.findOne({ where: { id, doctorId } });
    if (!cert) throw new NotFoundException('Certificate not found');
    await cert.destroy();
    return { message: 'Deleted' };
  }

  async submitForVerification(doctorId: number) {
    const certs = await this.certificateModel.findAll({ where: { doctorId } });
    const now = new Date();
    for (const c of certs) {
      if (c.fileUrl) await c.update({ status: 'verifying', submittedAt: now });
    }
    return { message: 'Submitted for verification', count: certs.filter((c) => c.fileUrl).length };
  }
}
