import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Feedback } from '../database/models/feedback.model.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { ChatFeedbackDto } from './dto/chat-feedback.dto.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are a friendly support assistant for a telemedicine app. Answer briefly and helpfully. Do not give medical diagnoses or prescribe treatments. For health decisions, advise users to consult a doctor. Keep replies concise (1-3 short paragraphs).`;

/** Simple keyword-based fallback when no API key is set */
function fallbackReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('appointment') || lower.includes('book') || lower.includes('consult')) {
    return 'You can book a consultation from the Consult section. Choose a doctor and time that works for you.';
  }
  if (lower.includes('emergency') || lower.includes('urgent')) {
    return 'For emergencies, please call the emergency number or go to the nearest hospital. Use the red Emergency button in the app to call our hotline.';
  }
  if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('pharmacy')) {
    return 'Prescriptions from your consultations can be viewed in your records. You can also use the Pharmacy section to order medicines.';
  }
  if (lower.includes('feedback') || lower.includes('complaint') || lower.includes('issue')) {
    return 'Your message will be sent to our team. We\'ll get back to you as soon as we can. Is there anything else I can help with?';
  }
  return 'Thanks for your message. Our team will review it. For specific medical questions, please book a consultation with a doctor.';
}

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback) private readonly feedbackModel: typeof Feedback,
    private readonly config: ConfigService,
  ) { }

  async create(userId: number, dto: CreateFeedbackDto) {
    return this.feedbackModel.create({
      userId,
      subject: dto.subject,
      body: dto.body,
    });
  }

  async chat(dto: ChatFeedbackDto): Promise<{ reply: string }> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey?.trim()) {
      return { reply: fallbackReply(dto.message) };
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];
    if (dto.history?.length) {
      for (const m of dto.history) {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: m.content });
        }
      }
    }
    messages.push({ role: 'user', content: dto.message });

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          max_tokens: 256,
          temperature: 0.4,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API error: ${res.status} ${err}`);
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('Empty Groq response');
      return { reply: content };
    } catch {
      return { reply: fallbackReply(dto.message) };
    }
  }
}
