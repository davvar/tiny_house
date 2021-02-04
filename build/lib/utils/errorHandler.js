"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function errorHandler({ msg = '', error, }) {
    throw new Error(`Failed to query ${msg}: ${error}`);
}
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map