import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  base: "/Docker_Roadmap3.0/",
  plugins: [react()],
});
