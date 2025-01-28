import { Types } from "mongoose";
import { JoinSettings } from "../enums/join-settings.enum";

export class CreateGroupsMetadataDto {
    conversation: Types.ObjectId;
    joinSettings?: JoinSettings;
}
