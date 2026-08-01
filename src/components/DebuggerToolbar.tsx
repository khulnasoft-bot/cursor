/**
 * Debugger Toolbar Component
 * Debug control buttons (start, stop, step over, step into, continue)
 */

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faStop, faArrowRight, faArrowDown, faArrowUp, faPause } from '@fortawesome/free-solid-svg-icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../app/store'
import {
    continueExecution,
    pauseExecution,
    stepOver,
    stepInto,
    stepOut,
    stopDebugSession
} from '../features/debugger/debuggerThunks'

const DebuggerToolbar: React.FC = () => {
    const dispatch = useDispatch()
    const { activeSessionId, isDebugging, isPaused } = useSelector((state: RootState) => state.debugger)

    const handleContinue = () => {
        if (activeSessionId) {
            dispatch(continueExecution(activeSessionId))
        }
    }

    const handlePause = () => {
        if (activeSessionId) {
            dispatch(pauseExecution(activeSessionId))
        }
    }

    const handleStepOver = () => {
        if (activeSessionId) {
            dispatch(stepOver(activeSessionId))
        }
    }

    const handleStepInto = () => {
        if (activeSessionId) {
            dispatch(stepInto(activeSessionId))
        }
    }

    const handleStepOut = () => {
        if (activeSessionId) {
            dispatch(stepOut(activeSessionId))
        }
    }

    const handleStop = () => {
        if (activeSessionId) {
            dispatch(stopDebugSession(activeSessionId))
        }
    }

    if (!isDebugging) {
        return null
    }

    return (
        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
            <button
                onClick={isPaused ? handleContinue : handlePause}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title={isPaused ? 'Continue' : 'Pause'}
            >
                <FontAwesomeIcon icon={isPaused ? faPlay : faPause} className="text-green-400" />
            </button>
            <button
                onClick={handleStepOver}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Step Over"
                disabled={!isPaused}
            >
                <FontAwesomeIcon icon={faArrowRight} className="text-blue-400" />
            </button>
            <button
                onClick={handleStepInto}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Step Into"
                disabled={!isPaused}
            >
                <FontAwesomeIcon icon={faArrowDown} className="text-blue-400" />
            </button>
            <button
                onClick={handleStepOut}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Step Out"
                disabled={!isPaused}
            >
                <FontAwesomeIcon icon={faArrowUp} className="text-blue-400" />
            </button>
            <button
                onClick={handleStop}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Stop"
            >
                <FontAwesomeIcon icon={faStop} className="text-red-400" />
            </button>
        </div>
    )
}

export default DebuggerToolbar
