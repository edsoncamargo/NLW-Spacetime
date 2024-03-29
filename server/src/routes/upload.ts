import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import { FastifyInstance } from "fastify";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from 'node:util';

const pump = promisify(pipeline);

export async function uploadRoutes(app: FastifyInstance) {
    app.post('/upload', async (req, reply) => {
        console.log(req.hostname)
        const upload = await req.file({
            limits: {
                fileSize: 5_242_880
            }
        });

        if (Boolean(upload) === false) {
            return reply.status(400).send();
        }

        const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/;
        const isValidFileFormat = mimeTypeRegex.test(upload!.mimetype);

        if (isValidFileFormat === false) {
            return reply.status(400).send();
        }

        const fileId = randomUUID();
        const extension = extname(upload!.filename);

        const fileName = fileId.concat(extension);

        const writeStream = createWriteStream(
            resolve(__dirname, '../../uploads/', fileName),
        );

        // Amazon S3, Google GCS, Clousflare R2

        await pump(upload!.file, writeStream);

        const fullUrl = req.protocol.concat('://').concat(req.hostname);
        const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString();

        return fileUrl;
    });
}