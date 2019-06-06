import testRunTracker from '../../api/test-run-tracker';
import COMMAND_TYPE from "../../test-run/commands/type";
const serviceCommands             = require('../../test-run/commands/service');
const AssertionExecutor           = require('../../assertions/executor');


class TestRunMock {
    constructor (id, fixtureCtx) {
        this.id = id;

        this.testCtx    = Object.create(null);
        this.fixtureCtx = fixtureCtx;

        testRunTracker.activeTestRuns[id] = this;

        this.opts = {
            assertionTimeout: 10000
        };
    }

    async addRequestHooks (hooks) {
        return await proc.send('add-request-hooks', { id: this.id, hooks });
    }

    async removeRequestHooks (hooks) {
        return await proc.send('remove-request-hooks', { id: this.id, hooks });
    }

    async _executeAssertion (command, callsite) {
        const assertionTimeout = command.options.timeout === void 0 ? this.opts.assertionTimeout : command.options.timeout;
        const executor         = new AssertionExecutor(command, assertionTimeout, callsite);

        executor.once('start-assertion-retries', timeout => this.executeCommand(new serviceCommands.ShowAssertionRetriesStatusCommand(timeout)));
        executor.once('end-assertion-retries', success => this.executeCommand(new serviceCommands.HideAssertionRetriesStatusCommand(success)));

        return executor.run();
    }


    async switchToCleanRun () {
        await proc.send('switch-to-clean-run', { id: this.id });
    }

    async getCurrentUrl () {
        return await proc.send('get-current-url', { id: this.id });
    }

    executeCommandSync (command) {
    }

    async executeCommand (command, callsite) {
        if (command.type === COMMAND_TYPE.assertion)
            return this._executeAssertion(command, callsite);

        return await proc.send('execute-command', { command, id: this.id });
    }
}

export default TestRunMock;

