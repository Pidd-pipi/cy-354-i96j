import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export type LostFoundView = "lost" | "found" | "public" | "done";

export class ListPostsQuery {
  @IsOptional()
  @IsIn(["lost", "found", "public", "done"], { message: "view 只能是 lost / found / public / done" })
  view?: LostFoundView;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  campus?: string;
}
