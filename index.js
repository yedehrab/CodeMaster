import {startHttpServer} from "./lib/server";

/**
 * Uygulama
 */
const app = {};

/**
 * Uygulamanın başlatma
 */
app.start = () => {
    startHttpServer();
}

// Uygulamayı başlatma
app.start();
