import express from 'express';
import http from 'http';
import router from './router';
import { resolve } from 'path';

const app = express();
const server = http.createServer(app);
const root = (src) => resolve(process.cwd(), src);

app.set('port', 4000);
app.use(express.static(root('build')));
app.use(router);

server.listen(app.get('port'), (console.log(`Server is listening on port ${app.get('port')}`)));