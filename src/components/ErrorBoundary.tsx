import { Component, ErrorInfo, ReactNode } from 'react'
import log from 'electron-log'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        log.error('React Error Boundary caught an error:', error)
        log.error('Component stack:', errorInfo.componentStack)
        this.setState({ errorInfo })
    }

    private handleReload = (): void => {
        window.location.reload()
    }

    private handleDismiss = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        padding: '20px',
                        fontFamily: 'system-ui, sans-serif',
                        backgroundColor: '#1e1e1e',
                        color: '#cccccc',
                    }}
                >
                    <h2 style={{ marginBottom: '16px', color: '#ff6b6b' }}>
                        Something went wrong
                    </h2>
                    <p
                        style={{
                            marginBottom: '8px',
                            maxWidth: '600px',
                            textAlign: 'center',
                        }}
                    >
                        The application encountered an unexpected error and
                        cannot continue.
                    </p>
                    {this.state.error && (
                        <details
                            style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#2d2d2d',
                                borderRadius: '4px',
                                maxWidth: '600px',
                                width: '100%',
                            }}
                        >
                            <summary
                                style={{
                                    cursor: 'pointer',
                                    marginBottom: '8px',
                                }}
                            >
                                Error details
                            </summary>
                            <pre
                                style={{
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '12px',
                                    color: '#f48771',
                                }}
                            >
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleReload}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#0e639c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Reload Application
                        </button>
                        <button
                            onClick={this.handleDismiss}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#3c3c3c',
                                color: '#cccccc',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
