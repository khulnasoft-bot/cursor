import * as ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { App } from './appComponent'
import { ErrorBoundary } from './components/ErrorBoundary'
import Modal from 'react-modal'

Modal.setAppElement('#root')
const container = document.getElementById('root')!
const root = ReactDOM.createRoot(container)
root.render(
    <Provider store={store}>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </Provider>
)
