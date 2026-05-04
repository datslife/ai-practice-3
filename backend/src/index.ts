import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { createSocketGateway } from './socket/gateway';

const PORT = process.env.PORT ?? 3000;

const app = createApp();
const httpServer = createServer(app);
createSocketGateway(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
