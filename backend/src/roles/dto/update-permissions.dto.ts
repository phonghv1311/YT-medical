import { IsArray, IsInt } from 'class-validator';

export class UpdatePermissionsDto {
  @IsArray() @IsInt({ each: true }) permissionIds!: number[];
}
