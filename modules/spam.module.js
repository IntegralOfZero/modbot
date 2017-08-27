"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var OBSERVATION_DURATION = 5000; // 1000 milliseconds in a second :D
var OBSERVATION_MESSAGE_COUNT_LIMIT = 5;
var PROBATION_DURATION = 60000; // period in which new messages sent are deleted, and restarts each time it occurs
var PROBATION_MESSAGE_COUNT_LIMIT = 5; // reaching this will cause a consequence to occur
var SpamModule = (function () {
    function SpamModule() {
        this.records = {};
    }
    SpamModule.prototype.execute = function (userRecord, message) {
        var spamRecord = userRecord.spamRecord;
        spamRecord.execute(message);
    };
    return SpamModule;
}());
exports.SpamModule = SpamModule;
var SpamRecord = (function () {
    function SpamRecord() {
        this.resetMessageTracking();
        // make all the states very apparent, ideally ordered by ascending escalation
        this.observationState = new ObservationSpamRecordState(this, new DurationIncrementActionEscalationStrategy(), OBSERVATION_DURATION, OBSERVATION_MESSAGE_COUNT_LIMIT);
        this.probationState = new ProbationSpamRecordState(this, new DurationIncrementActionEscalationStrategy(), PROBATION_DURATION, PROBATION_MESSAGE_COUNT_LIMIT);
        this.consequenceState = new ConsequenceSpamRecordState(this, 0, 0);
        this.currentState = this.observationState;
    }
    SpamRecord.prototype.deescalateState = function () {
        this.currentState.deescalateState();
    };
    SpamRecord.prototype.escalateState = function () {
        this.currentState.escalateState();
    };
    SpamRecord.prototype.execute = function (message) {
        this.currentState.execute(message);
    };
    SpamRecord.prototype.getCurrentState = function () {
        return this.currentState;
    };
    SpamRecord.prototype.resetMessageTracking = function () {
        this.timeStart = Date.now();
        this.messageCount = 0;
    };
    SpamRecord.prototype.transitionToObservationState = function () {
        this.currentState = this.observationState;
    };
    SpamRecord.prototype.transitionToProbationState = function () {
        this.currentState = this.probationState;
    };
    SpamRecord.prototype.transitionToConsequenceState = function () {
        this.currentState = this.consequenceState;
    };
    return SpamRecord;
}());
exports.SpamRecord = SpamRecord;
var SpamRecordState = (function () {
    function SpamRecordState(duration, limit) {
        this.duration = duration;
        this.limit = limit;
    }
    return SpamRecordState;
}());
var ObservationSpamRecordState = (function (_super) {
    __extends(ObservationSpamRecordState, _super);
    function ObservationSpamRecordState(spamRecord, executionStrategy, duration, limit) {
        var _this = _super.call(this, duration, limit) || this;
        _this.spamRecord = spamRecord;
        _this.executionStrategy = executionStrategy;
        return _this;
    }
    ObservationSpamRecordState.prototype.deescalateState = function () {
        this.spamRecord.resetMessageTracking();
    };
    ObservationSpamRecordState.prototype.escalateState = function () {
        this.spamRecord.resetMessageTracking();
        this.spamRecord.transitionToProbationState();
    };
    ObservationSpamRecordState.prototype.execute = function (message) {
        this.executionStrategy.execute(this.spamRecord, null);
    };
    return ObservationSpamRecordState;
}(SpamRecordState));
var ProbationSpamRecordState = (function (_super) {
    __extends(ProbationSpamRecordState, _super);
    function ProbationSpamRecordState(spamRecord, executionStrategy, duration, limit) {
        var _this = _super.call(this, duration, limit) || this;
        _this.spamRecord = spamRecord;
        _this.executionStrategy = executionStrategy;
        return _this;
    }
    ProbationSpamRecordState.prototype.deescalateState = function () {
        this.spamRecord.resetMessageTracking();
        this.spamRecord.transitionToObservationState();
    };
    ProbationSpamRecordState.prototype.escalateState = function () {
        this.spamRecord.resetMessageTracking();
        this.spamRecord.transitionToConsequenceState();
    };
    ProbationSpamRecordState.prototype.execute = function (message) {
        this.executionStrategy.execute(this.spamRecord, function () {
            message["delete"]()
                .then(function () {
                console.log("Spam deleted from user: " + message.author.username);
            })["catch"](function (error) {
                console.log(error);
            });
        });
    };
    return ProbationSpamRecordState;
}(SpamRecordState));
var ConsequenceSpamRecordState = (function (_super) {
    __extends(ConsequenceSpamRecordState, _super);
    function ConsequenceSpamRecordState(spamRecord, duration, limit) {
        var _this = _super.call(this, duration, limit) || this;
        _this.spamRecord = spamRecord;
        return _this;
    }
    ConsequenceSpamRecordState.prototype.deescalateState = function () {
    };
    ConsequenceSpamRecordState.prototype.escalateState = function () {
    };
    ConsequenceSpamRecordState.prototype.execute = function (message) {
        // mute, kick, ban 
        // impacts the user itself (message.author)
        // invoke some global mechanism
        console.log("CONSEQUENCE");
    };
    return ConsequenceSpamRecordState;
}(SpamRecordState));
var DurationIncrementActionEscalationStrategy = (function () {
    function DurationIncrementActionEscalationStrategy() {
    }
    DurationIncrementActionEscalationStrategy.prototype.execute = function (spamRecord, action) {
        if (Date.now() < (spamRecord.timeStart + spamRecord.getCurrentState().duration)) {
            spamRecord.messageCount++;
            if (action) {
                action();
            }
            if (spamRecord.messageCount > spamRecord.getCurrentState().limit) {
                spamRecord.escalateState();
            }
        }
        else {
            spamRecord.deescalateState();
        }
    };
    return DurationIncrementActionEscalationStrategy;
}());
