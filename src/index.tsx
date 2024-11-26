import 'demo/Inject'
import { createRoot } from 'react-dom/client'
import Demo from './demo/demo'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(<Demo />)
