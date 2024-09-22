const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
// const MockAdapter = require('@bot-whatsapp/database/mock')
const MongoAdapter = require('@bot-whatsapp/database/mongo')
const { delay } = require('@whiskeysockets/baileys')
const path = require("path")
const fs = require("fs")

const chat = require("./chatGPT")
const { handlerAI } =require("./whisper")

const asistenciaPath = path.join(__dirname, "mensajes", "asistencia.txt")
const asistencia = fs.readFileSync(asistenciaPath, "utf8")

const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt")
const promptConsultas = fs.readFileSync(pathConsultas, "utf8")

const menuconsultasPath = path.join(__dirname, "mensajes", "consultas.txt")
const consultas = fs.readFileSync(menuconsultasPath, "utf8")

const inicialPath = path.join(__dirname, "mensajes", "inicial.txt")
const inicial = fs.readFileSync(inicialPath, "utf8")

const comprarPath = path.join(__dirname, "mensajes", "comprar.txt")
const comprar = fs.readFileSync(comprarPath, "utf8")

const flujoPath = path.join(__dirname, "mensajes", "flujo.txt")
const flujo = fs.readFileSync(flujoPath, "utf8")

const extractNumber = (text) => {
    // Extrae el primer número que encuentre en el texto
    const match = text.match(/\d/);
    return match ? match[0] : null; // Devuelve el primer número encontrado o null si no encuentra ninguno
};

const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer("Basado en la nota de voz..", null, async(ctx,ctxFn) => {
    const text = await handlerAI(ctx)
    const prompt = promptConsultas
    const consulta = text
    const answer = await chat(prompt, consulta)
    await ctxFn.flowDynamic(answer.content)})

const flowConsultas = addKeyword(EVENTS.ACTION)
    .addAnswer("Por favor realiza tu consulta ahora", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
    })
    .addAnswer("Estoy feliz de poder ayudarte", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
    })
    .addAnswer("Espero mis respuestas esten siendo utiles", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
    })
    .addAnswer(consultas, {
        delay:2000
    })
    .addAnswer("👉 *Ingresa el número de la opción que elijas:*",
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        const number = extractNumber(ctx.body); 

        if (!number || !["1", "2", "3", "0"].includes(number)) {
            return fallBack(
                "Opción no válida. Escribe '1' para seguir en este flujo, '2' para regresar al menú de servicios, '3' para volver al menú principal, o '0' para salir."
            );
        }
        switch (number) {
            case "1":
                return gotoFlow(flowConsultas);
            case "2":
                return gotoFlow(flowLlamada);
            case "3":
                return gotoFlow(flowAsistencia);
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo *'Menu'* ");
        }

    }
);

const flowComprarproductos = addKeyword(['comprar en linea', 'comprar online' , 'quiero comprar los productos' , 'como puedo comprar los productos', 'deseo realizar una compra', 'comprar producto', 'comprar los productos'], EVENTS.ACTION)
    .addAnswer("Para facilitarte la vida, todos tus compras incluyen envio gratis y tenemos las siguientes formas de compra que puedes elegir:", {
        delay: 2000
    })
    .addAnswer(comprar, {
        delay:1000
    })
    .addAnswer("👉 *Ingresa el número de la opción de compra que deseas elegir:*",
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        const number = extractNumber(ctx.body); 

        if (!number || !["1", "2", "3", "0"].includes(number)) {
            return fallBack(
                "Opción no válida. Escribe '1' si deseas comprar en nuestra tienda online, '2' si deseas comprar via transferencia, '3' para comprar mediante un link de pago, o '0' para ir al menu principal."
            );
        }
        switch (number) {
            case "1":
                return gotoFlow(flowComprarentienda);
            case "2":
                return gotoFlow(flowComprarcontransferencia);
            case "3":
                return gotoFlow(flowComprarconlinkdepago);
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo *Menu* ");
        }

    }
);

const flowCatalogo = addKeyword(['catalogo de productos', 'quiero un catalogo', 'enviar catalogo'], EVENTS.ACTION)
    .addAnswer("Este es nuestro catalgo actualizado",{
        delay: 2000,
        media: "https://asistente.productosherba.life/base-baileys-memory/recursos/catalogo-de-productos-herbalife.pdf" 
    })
    .addAnswer("Revisalo con calma y decide cual es el producto que mas se ajusta a tus necesidades actuales", {
        delay: 3000,
    })
    .addAnswer("Y si surge alguna inquietud sobre los productos o ya deseas realizar tu pedido no dudes en hacermelo saber, recuerda que estoy para servirte.", {
        delay: 3000,
    })


const flowComprarentienda = addKeyword(['comprar en la tienda online', 'comprar en el ecommere'], EVENTS.ACTION)
    .addAnswer("Perfecto, para comprar en nuestra tienda online porfavor da clic en el siguiente enlace")
    .addAnswer("https://productosherba.life/herbalife/", {
        delay: 1500,
    })

const flowComprarcontransferencia = addKeyword(['comprar con transferencia', 'comprar via transferencia'], EVENTS.ACTION)
    .addAnswer("Perfecto, para comprar mediante transferencia, primero da clic en el siguiente enlace y selecciona los productos que deseas, despues, de clic en enviar solicitud de pedido para recibir tu numero de orden y enviarte la información bancaria para el pago", {
        delay: 1000,
    })
    .addAnswer("https://wa.me/c/593989032182", {
        delay: 1500,
    })

const flowComprarconlinkdepago = addKeyword(['comprar con transferencia', 'comprar via transferencia'], EVENTS.ACTION)
    .addAnswer("Perfecto, para comprar mediante un link de pago, primero da clic en el siguiente enlace y selecciona los productos que deseas, despues, de clic en enviar solicitud de pedido para recibir tu numero de orden y enviarte el link de pago directo", {
        delay: 1000,
    })
    .addAnswer("https://wa.me/c/593989032182", {
        delay: 1500,
    })


const flowLlamada = addKeyword(['devolver llamada', 'necesito que me llames', 'puedes llamarme', 'te llamo' , 'te puedo llamar', 'llamame', 'agendar una llamada', 'programar una llamada', 'programar llamada', 'agendar llamada'], EVENTS.ACTION)
    .addAnswer("Listo, en un momento alguien del equipo te contactará con una llamada. Le agradecemos de antemano su paciencia.")

const flowAgendamientos = addKeyword(['programar una reunion', 'programar reunión', 'agendar una reunión', 'agendamiento de reunion', 'programar una reunión', 'agendar reunion', 'reunion agendamiento', 'agendamiento reunion'], EVENTS.ACTION)
    .addAnswer("Perfecto, nos comunicaremos contigo en breve para programar una reunión que puede ser online o presencial.")

const flowAsistencia = addKeyword(['asistencia', 'asesoria'], EVENTS.ACTION)
    .addAnswer(asistencia, {
        delay:2000
    })
    .addAnswer("👉 *Ingresa el número de la opción que elijas:*",
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        const number = extractNumber(ctx.body); 

        if (!number || !["1", "2", "3", "4", "0"].includes(number)) {
            return fallBack(
                "Opción no válida. Escribe '1' para realizar una, '2' para solicitar una llamada, '3' para programar una reunión, '4' para conocer sobre los servicios o '0' para salir."
            );
        }
        switch (number) {
            case "1":
                return gotoFlow(flowConsultas);
            case "2":
                return gotoFlow(flowLlamada);
            case "3":
                return gotoFlow(flowAgendamientos);
            case "0":
                return gotoFlow(flowInicial);
        }

    }
);

const flowInicial = addKeyword (EVENTS.ACTION)
    .addAnswer("Estas son las opciones iniciales que tienes para elegir", {
        delay: 1000
    })
    .addAnswer(inicial, {
        delay:1500
    })
    .addAnswer("👉 *Ingresa el número de la opción que elijas:*",
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        const number = extractNumber(ctx.body); 

        if (!number || !["1", "2", "3"].includes(number)) {
            return fallBack(
                "Opción no válida. Escribe '1' para comprar online, '2' para solicitar una llamada, o, 3 para solicitar nuestro catalogo de productos."
            );
        }
        switch (number) {
            case "1":
                return gotoFlow(flowComprarproductos);
            case "2":
                return gotoFlow(flowAsistencia);
            case "3":
                return gotoFlow(flowCatalogo);
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo *Menu* ");
        }

    }
);

const flowSaludo = addKeyword (['hi', 'hola', 'hey', 'ola', 'alo', 'hello', 'mas informacion', 'más información', 'deseo información', 'ayuda'])
    .addAnswer("Hola, para ayudarte a cumplir tus metas de bienestar y control de peso tenemos las siguientes opciones con las que puedes empezar.", {
        delay: 1000
    })
    .addAnswer(inicial, {
        delay:1500
    })
    .addAnswer("👉 *Ingresa el número de la opción que elijas:*",
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        const number = extractNumber(ctx.body); 

        if (!number || !["1", "2", "3"].includes(number)) {
            return fallBack(
                "Opción no válida. Escribe '1' para comprar online, '2' para solicitar una llamada, o, 3 para solicitar nuestro catalogo de productos."
            );
        }
        switch (number) {
            case "1":
                return gotoFlow(flowComprarproductos);
            case "2":
                return gotoFlow(flowAsistencia);
            case "3":
                return gotoFlow(flowCatalogo);
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo *Menu* ");
        }

    }
);


const main = async () => {
    //const adapterDB = new MockAdapter()
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGO_DB_URI,
        dbName: "WLTAsistente"
    })
    const adapterFlow = createFlow([flowComprarproductos, flowCatalogo,flowConsultas, flowLlamada, flowAgendamientos, flowVoice, flowAsistencia, flowSaludo, flowComprarentienda, flowComprarcontransferencia, flowComprarconlinkdepago])
    const adapterProvider = createProvider(BaileysProvider)

    createBot(
        {
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        }
    )

    QRPortalWeb()
}
 
main()
