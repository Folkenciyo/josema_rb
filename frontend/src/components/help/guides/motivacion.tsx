import { ArrowUp, Play, Plus, SkipForward } from "lucide-react";

import {
  Btn,
  Bullets,
  Note,
  OpenScreen,
  P,
  Section,
  Step,
  Steps,
  Term,
  Where,
} from "../help-ui";

export function Motivacion() {
  return (
    <>
      <P>
        Cada mañana, al abrir su portal, tus clientes se encuentran un mensaje
        tuyo: una frase, una imagen o un vídeo corto.{" "}
        <strong>Todos leen el mismo</strong>, y al día siguiente pasa solo al que
        va detrás en la cola. Tú decides el orden y cuál está puesto.
      </P>

      <OpenScreen
        href="/quotes"
        label="Abrir Motivación"
        note="La cola completa y lo que se lee hoy"
      />

      <Section id="crear" title="Añadir un mensaje">
        <Steps>
          <Step title="Pulsa Nuevo mensaje">
            <Btn icon={Plus}>Nuevo mensaje</Btn>, arriba a la derecha.
          </Step>
          <Step title="Escribe el texto y el autor">
            El texto es obligatorio; el autor, opcional.
          </Step>
          <Step title="Añádele un vídeo o una imagen">
            Pega el enlace de un <strong>Short de YouTube</strong> o de un{" "}
            <strong>Reel de Instagram</strong> y se incrusta en el portal, o
            sube una imagen tuya. Cada mensaje admite una cosa o la otra, no las
            dos.
          </Step>
        </Steps>
        <Note>
          Vale cualquier forma del enlace de YouTube — <em>youtu.be</em>,{" "}
          <em>/shorts/</em>, <em>/watch?v=</em> —: la aplicación se queda solo con
          el identificador del vídeo.
        </Note>
      </Section>

      <Section id="cola" title="Cómo funciona la cola">
        <P>
          Arriba del todo, <Term>Hoy leen esto</Term> te enseña el mensaje que
          está puesto y, al lado, los seis días siguientes con su fecha. Debajo
          está la biblioteca entera, ya en el orden de la cola: la tarjeta de hoy
          va marcada en granate y la de mañana lleva su etiqueta.
        </P>
        <Bullets>
          <li>
            <Btn icon={Play} variant="secondary">Hoy</Btn> — pone ese mensaje
            ahora mismo. A partir de mañana la cola sigue desde él.
          </li>
          <li>
            <Btn icon={SkipForward} variant="secondary">El siguiente</Btn> — lo
            coloca justo detrás del de hoy, sin tocar lo que se está leyendo.
          </li>
          <li>
            <Btn icon={ArrowUp} variant="secondary">Flechas</Btn> — suben o bajan
            un mensaje en la cola.
          </li>
        </Bullets>
        <P>
          Cuando la cola llega al final, vuelve a empezar. Los mensajes nuevos
          entran siempre al final, así que nunca se cuelan delante de lo que ya
          tenías previsto.
        </P>
        <Note>
          Reordenar la cola <strong>nunca cambia el mensaje de hoy</strong>: lo
          que tus clientes ya tienen delante esta mañana se queda donde está.
        </Note>
      </Section>

      <Section id="fijar" title="Fijarle un mensaje a un cliente">
        <P>
          A veces uno necesita algo distinto del resto. En su ficha, la tarjeta{" "}
          <Term>Mensaje fijado</Term> te deja clavarle uno: lo verá siempre ese,
          por encima de la cola, hasta que lo devuelvas a{" "}
          <Term>El de la cola de cada día (automático)</Term>.
        </P>
        <Note>
          Si borras un mensaje que estaba fijado a alguien, ese cliente vuelve
          solo a la cola común. No se queda sin nada.
        </Note>
      </Section>

      <Section id="donde-se-ve" title="Dónde lo ve el cliente">
        <P>
          En la portada de su portal, encima de sus accesos. Si el mensaje lleva
          vídeo, se reproduce ahí mismo sin salir de la página. Puedes
          comprobarlo entrando tú en el enlace de cualquier cliente desde su{" "}
          <Where href="/clients">ficha</Where>.
        </P>
      </Section>
    </>
  );
}
