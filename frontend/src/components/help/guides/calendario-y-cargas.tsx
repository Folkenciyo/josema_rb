import { Play } from "lucide-react";

import {
  Bullets,
  Note,
  OpenScreen,
  P,
  Section,
  Term,
  Where,
} from "../help-ui";

export function CalendarioYCargas() {
  return (
    <>
      <P>
        Todo esto se alimenta de una sola cosa: que el cliente apunte sus series
        desde su portal. Si lo hace, su ficha te cuenta qué días fue, si cumple
        el plan y si está subiendo peso.
      </P>

      <OpenScreen
        href="/clients"
        label="Abrir Clientes"
        note="Todo esto vive dentro de la ficha de cada uno"
      />

      <Section id="como-apunta" title="Cómo apunta el cliente">
        <P>
          En su portal, en <strong>Entreno</strong>, elige el día de su rutina y
          entra en el modo guiado: le va enseñando ejercicio por ejercicio, con
          el objetivo de series y repeticiones, lo que levantó la última vez y un
          temporizador de descanso.
        </P>
        <P>
          Solo se guardan las series que marca. Si el plan pedía cuatro y apunta
          tres, quedan tres: no hay que borrar nada.
        </P>
        <Note>
          Si entrena sin cobertura la sesión se guarda en su móvil y se manda
          sola al recuperar la red. Puede tardar en aparecer en tu pantalla, pero
          no se pierde.
        </Note>
      </Section>

      <Section id="calendario" title="El calendario de entrenos">
        <P>
          Un mes por pantalla, con flechas para moverte. Cada día se lee de un
          vistazo:
        </P>
        <Bullets>
          <li>
            <strong>Relleno granate</strong> — entrenó ese día. Al pulsarlo se
            abre la sesión con todas sus series.
          </li>
          <li>
            <strong>Borde punteado ámbar</strong> — le tocaba y no hay sesión.
          </li>
          <li>
            <strong>Borde punteado gris</strong> — le toca, pero aún no ha
            llegado el día.
          </li>
          <li>
            <strong>Anillo</strong> — hoy.
          </li>
        </Bullets>
        <P>
          Debajo, el resumen del mes: <Term>X de Y días previstos</Term> y
          cuántos se saltó. Los días que todavía no han llegado no cuentan como
          fallos.
        </P>
        <Note kind="warn">
          Para que aparezcan los días previstos, el plan activo necesita{" "}
          <strong>fecha de inicio</strong>. Y si es una rutina de una semana que
          se repite, hay que marcar{" "}
          <Term>Repetir las semanas hasta la fecha de fin</Term> al editarlo, o
          el calendario dará el plan por acabado a los siete días.
        </Note>
      </Section>

      <Section id="sesiones" title="Sesiones entrenadas">
        <P>
          Debajo del calendario está el listado completo, de la más reciente a la
          más antigua, con los ejercicios, las series y los kilos totales
          movidos. Cada línea se despliega para ver serie por serie lo que
          levantó, junto al objetivo que le habías puesto.
        </P>
      </Section>

      <Section id="progresion" title="Progresión por ejercicio">
        <P>
          La tarjeta <Term>Progresión por ejercicio</Term> tiene un selector con
          todos los ejercicios que ese cliente ha registrado alguna vez. Al
          elegir uno, dibuja la <strong>serie más pesada de cada día</strong> y
          la diferencia desde la primera vez: en verde si sube, en rojo si baja.
        </P>
        <P>
          Con una sola sesión todavía no hay línea que dibujar; a la segunda ya
          se ve la tendencia.
        </P>
      </Section>

      <Section id="lo-ve-el-cliente" title="El cliente también lo ve">
        <P>
          En su portal, <strong>Mi progreso</strong> le enseña las mismas
          gráficas de sus ejercicios y su récord en cada uno. Aparece en su
          portada en cuanto registra la primera sesión.
        </P>
      </Section>

      <Section id="sin-datos" title="Si el cliente no apunta nada">
        <P>
          Entonces el calendario estará vacío, y no es un fallo: está diciendo la
          verdad. No hay forma de marcar asistencia a mano, así que si un cliente
          no usa el registro, esta parte no te dirá nada de él. Enséñale el modo{" "}
          <Play className="inline size-3.5" /> de su portal la primera vez;
          suele bastar con una.
        </P>
        <P>
          El resto de su seguimiento — <Where href="/clients">peso y fotos</Where>{" "}
          — funciona igual aunque no registre ni un solo entreno.
        </P>
      </Section>
    </>
  );
}
