import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export type NewsArticleStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

@Table({ tableName: 'news_articles', timestamps: true })
export class NewsArticle extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(3000), allowNull: false })
  declare title: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare category: string | null;

  // Store cover image URL (public) + key for deleting/updating later.
  @Column({ type: DataType.STRING(2000), allowNull: true })
  declare coverImageUrl: string | null;

  @Column({ type: DataType.STRING(2000), allowNull: true })
  declare coverImageKey: string | null;

  // Content as paragraphs (string[]). Kept as JSON for easier editor integration.
  @Column({ type: DataType.JSON, allowNull: false, defaultValue: [] })
  declare content: string[];

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'DRAFT',
  })
  declare status: NewsArticleStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare scheduledAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare publishedAt: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare createdByUserId: number | null;

  @BelongsTo(() => User)
  declare createdByUser?: User;
}

export default NewsArticle;

