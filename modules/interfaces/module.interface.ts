import { UserRecord } from "../../index";

export interface Module {
    execute(userRecord: UserRecord, message: any): void;
}