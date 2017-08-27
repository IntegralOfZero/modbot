import { Module } from "./interfaces/module.interface";

const OBSERVATION_DURATION = 5000; // 1000 milliseconds in a second :D
const OBSERVATION_MESSAGE_COUNT_LIMIT = 5;
const PROBATION_DURATION = 60000; // period in which new messages sent are deleted, and restarts each time it occurs
const PROBATION_MESSAGE_COUNT_LIMIT = 5; // reaching this will cause a consequence to occur

export class SpamModule implements Module { 

    private records = {};

    execute(userRecord, message) {

        let spamRecord: SpamRecord = userRecord.spamRecord;

        spamRecord.execute(message);
    }
}

export class SpamRecord {
    timeStart: number; // in milliseconds, since Jan 1, 1970
    messageCount: number; // counter of messages since timeStart (inclusive)
    
    currentState: SpamRecordState;
    private observationState: ObservationSpamRecordState;
    private probationState: ProbationSpamRecordState;
    private consequenceState: ConsequenceSpamRecordState;

    constructor() {
        this.resetMessageTracking();

        // make all the states very apparent, ideally ordered by ascending escalation
        this.observationState = new ObservationSpamRecordState(this, new DurationIncrementActionEscalationStrategy(), OBSERVATION_DURATION, OBSERVATION_MESSAGE_COUNT_LIMIT);
        this.probationState = new ProbationSpamRecordState(this, new DurationIncrementActionEscalationStrategy(), PROBATION_DURATION, PROBATION_MESSAGE_COUNT_LIMIT);
        this.consequenceState = new ConsequenceSpamRecordState(this, 0, 0);

        this.currentState = this.observationState;
    }

    deescalateState(): void {
        this.currentState.deescalateState();
    }
    
    escalateState(): void {
        this.currentState.escalateState();
    }

    execute(message: any) {
        this.currentState.execute(message);
    }

    getCurrentState(): SpamRecordState {
        return this.currentState;
    }

    resetMessageTracking(): void {
        this.timeStart = Date.now();
        this.messageCount = 0;
    }

    transitionToObservationState(): void {
        this.currentState = this.observationState;
    }

    transitionToProbationState(): void {
        this.currentState = this.probationState;
    }

    transitionToConsequenceState(): void {
        this.currentState = this.consequenceState;
    }
}


abstract class SpamRecordState {

    constructor(public duration: number, public limit: number) {

    }

    abstract deescalateState(): void;
    abstract escalateState(): void;
    abstract execute(message: any): void;
}

class ObservationSpamRecordState extends SpamRecordState {

    constructor(private spamRecord: SpamRecord, private executionStrategy: ExecutionStrategy, duration: number, limit: number) {
        super(duration, limit);
    }

    deescalateState(): void {
        this.spamRecord.resetMessageTracking();
    }

    escalateState(): void {
        this.spamRecord.resetMessageTracking();
        this.spamRecord.transitionToProbationState();
    }

    execute(message: any): void {
        this.executionStrategy.execute(this.spamRecord, null);
    }
}


class ProbationSpamRecordState extends SpamRecordState {

    constructor(private spamRecord: SpamRecord, private executionStrategy: ExecutionStrategy, duration: number, limit: number) {
        super(duration, limit);
    }

    deescalateState(): void {
        this.spamRecord.resetMessageTracking();
        this.spamRecord.transitionToObservationState();
    }

    escalateState(): void {
        this.spamRecord.resetMessageTracking();
        this.spamRecord.transitionToConsequenceState();
    }

    execute(message: any): void {
        this.executionStrategy.execute(this.spamRecord,
            () => {
                message.delete()
                    .then(() => {
                        console.log(`Spam deleted from user: ${message.author.username}`);
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }
        );
    }
}

class ConsequenceSpamRecordState extends SpamRecordState {

    constructor(private spamRecord: SpamRecord, duration: number, limit: number) {
        super(duration, limit);
    }

    deescalateState(): void {

    }

    escalateState(): void {

    }

    execute(message: any): void {
        // mute, kick, ban 
        // impacts the user itself (message.author)
        // invoke some global mechanism
        console.log("CONSEQUENCE");
    }
}

interface ExecutionStrategy {
    execute(spamRecord: SpamRecord, action: Function): void;
}

class DurationIncrementActionEscalationStrategy implements ExecutionStrategy {
    execute(spamRecord: SpamRecord, action: Function): void {
        if (Date.now() < (spamRecord.timeStart + spamRecord.getCurrentState().duration)) {
            spamRecord.messageCount++;
            
            if (action) {
                action();
            }
    
            if (spamRecord.messageCount > spamRecord.getCurrentState().limit) {
                spamRecord.escalateState();
            }
        } else {
            spamRecord.deescalateState();
        }     
    }
}