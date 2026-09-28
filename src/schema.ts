import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// Todo lo que aparece aquí se puede editar desde el panel "Props" del
// editor (Remotion Studio), sin tocar código.
export const promoSchema = z.object({
  colorAcento: zColor(),

  escena1: z.object({
    frase: z.string(),
    linea1: z.string(),
    linea2: z.string(),
    pregunta: z.string(),
  }),

  escena2Chat: z.object({
    titular: z.string(),
    nombreContacto: z.string(),
    mensajes: z.array(
      z.object({
        quien: z.enum(["cliente", "bitaxus"]),
        texto: z.string(),
        hora: z.string(),
      }),
    ),
  }),

  escena3Beneficios: z.object({
    titular: z.string(),
    beneficios: z.array(
      z.object({
        icono: z.string(),
        titulo: z.string(),
        texto: z.string(),
      }),
    ),
  }),

  escena4Global: z.object({
    titular1: z.string(),
    titular2: z.string(),
    monedaEnvio: z.string(),
    montoEnvio: z.string(),
    monedaResultado: z.string(),
    montoResultado: z.number().min(0),
    nota: z.string(),
  }),

  escena5Cierre: z.object({
    frase: z.string(),
    boton: z.string(),
    web: z.string(),
  }),

  // Duración de cada escena en segundos.
  duracion: z.object({
    escena1: z.number().min(1).max(20),
    escena2Chat: z.number().min(1).max(20),
    escena3Beneficios: z.number().min(1).max(20),
    escena4Global: z.number().min(1).max(20),
    escena5Cierre: z.number().min(1).max(20),
  }),
});

export type PromoProps = z.infer<typeof promoSchema>;

export const defaultPromoProps: PromoProps = {
  colorAcento: "#c1121f",
  escena1: {
    frase: "Cobrar debería ser tan fácil como enviar un mensaje.",
    linea1: "Vendiste",
    linea2: "como nunca",
    pregunta: "¿Y LA PLATA?",
  },
  escena2Chat: {
    titular: "No necesitas otra aplicación",
    nombreContacto: "Bitaxus",
    mensajes: [
      { quien: "cliente", texto: "Quiero programar un recaudo.", hora: "10:44 AM" },
      {
        quien: "bitaxus",
        texto: "¡Claro! Vamos paso a paso. ¿Cuánto vas a cobrar y cuál es el concepto?",
        hora: "10:45 AM",
      },
      { quien: "cliente", texto: "$1.250.000 por servicios de publicidad.", hora: "10:46 AM" },
      {
        quien: "bitaxus",
        texto: "Perfecto. Ahora cuéntame quién realizará el pago y te ayudo a dejar todo programado.",
        hora: "10:47 AM",
      },
    ],
  },
  escena3Beneficios: {
    titular: "Recibe, paga y decide con más claridad.",
    beneficios: [
      { icono: "↓", titulo: "Recaudos", texto: "Programa y registra los pagos que esperas recibir." },
      { icono: "↑", titulo: "Pagos y dispersiones", texto: "Organiza pagos individuales o múltiples." },
      { icono: "◎", titulo: "Decisiones más claras", texto: "Ordena tus movimientos y decide mejor." },
    ],
  },
  escena4Global: {
    titular1: "Más alcance,",
    titular2: "menos fronteras.",
    monedaEnvio: "USD",
    montoEnvio: "1.000",
    monedaResultado: "COP",
    montoResultado: 3912000,
    nota: "Valores de referencia. El resultado puede variar según la operación.",
  },
  escena5Cierre: {
    frase: "Cobra, paga y entiende tu dinero desde WhatsApp.",
    boton: "Hablemos →",
    web: "bitaxus.com",
  },
  duracion: {
    escena1: 3.5,
    escena2Chat: 6,
    escena3Beneficios: 4,
    escena4Global: 4,
    escena5Cierre: 4,
  },
};
