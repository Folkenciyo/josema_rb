import { Monitor, Moon, Plus, Save, Sun } from "lucide-react";

import {
  Btn,
  Bullets,
  Kbd,
  Note,
  OpenScreen,
  P,
  Section,
  Step,
  Steps,
  Term,
  Where,
} from "../help-ui";

export function AjustesYTrucos() {
  return (
    <>
      <P>
        Dos cosas se configuran una vez y sirven para siempre: el cuestionario
        que rellenan los clientes nuevos y el texto con el que les mandas su
        enlace. El resto de esta guía son atajos que ahorran tiempo.
      </P>

      <OpenScreen
        href="/settings"
        label="Abrir Ajustes"
        note="Cuestionario inicial y mensaje del enlace"
      />

      <Section id="cuestionario" title="El cuestionario inicial">
        <P>
          <strong>Las preguntas las escribes tú.</strong> No hay una lista
          cerrada: pones las que necesites, en el orden que quieras.
        </P>
        <Steps>
          <Step title="Añade preguntas">
            <Btn icon={Plus} variant="secondary">Añadir pregunta</Btn> y escribe
            el enunciado.
          </Step>
          <Step title="Elige el tipo">
            <Term>Respuesta corta</Term>, <Term>Respuesta larga</Term>,{" "}
            <Term>Número</Term>, <Term>Sí o no</Term> o{" "}
            <Term>Elegir una opción</Term> — en esta última, las opciones se
            escriben separadas por comas.
          </Step>
          <Step title="Marca las obligatorias">
            Con la casilla <Term>Obligatoria</Term>. Puedes añadir además una
            aclaración que el cliente verá bajo la pregunta.
          </Step>
          <Step title="Guarda">
            <Btn icon={Save}>Guardar cuestionario</Btn>. Se reordenan
            arrastrándolas.
          </Step>
        </Steps>
        <P>
          El cliente lo rellena desde <strong>Ficha</strong>, en su portal, y sus
          respuestas aparecen en la tarjeta <Term>Cuestionario</Term> de su ficha.
        </P>
        <Note>
          Cada respuesta guarda una copia del enunciado con el que se contestó.
          Así, si más adelante cambias una pregunta, las respuestas antiguas
          siguen teniendo sentido en vez de quedar colgando de un texto que ya no
          existe.
        </Note>
      </Section>

      <Section id="invitacion" title="El mensaje del enlace">
        <P>
          Es lo que se escribe solo cuando pulsas <Term>WhatsApp</Term> o{" "}
          <Term>Email</Term> en la ficha de un cliente. Puedes reescribirlo a tu
          gusto y usar estos comodines:
        </P>
        <Bullets>
          <li>
            <Term>{"{nombre}"}</Term> — el nombre de pila del cliente.
          </li>
          <li>
            <Term>{"{nombre_completo}"}</Term> — su nombre entero.
          </li>
          <li>
            <Term>{"{enlace}"}</Term> — su dirección privada.
          </li>
          <li>
            <Term>{"{entrenador}"}</Term> — tu nombre.
          </li>
        </Bullets>
        <P>
          Hay tres textos: el de WhatsApp, el asunto del correo y el cuerpo del
          correo. <Btn variant="secondary">Restaurar el de fábrica</Btn> devuelve
          cualquiera de ellos al original.
        </P>
      </Section>

      <Section id="buscador" title="El buscador rápido">
        <P>
          <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> desde cualquier pantalla — en Mac,{" "}
          <Kbd>⌘</Kbd> + <Kbd>K</Kbd>. Escribe y salta directamente a un cliente,
          un ejercicio, un alimento, una comida o un menú. Se mueve con las
          flechas y se abre con <Kbd>Enter</Kbd>.
        </P>
      </Section>

      <Section id="tema" title="Claro, oscuro o automático">
        <P>
          Abajo del menú lateral hay tres botones:{" "}
          <Sun className="inline size-4" /> claro,{" "}
          <Moon className="inline size-4" /> oscuro y{" "}
          <Monitor className="inline size-4" /> automático, que sigue lo que
          tenga puesto tu móvil u ordenador. La elección se recuerda en ese
          dispositivo.
        </P>
        <Note>
          Los documentos en PDF y Word salen siempre en claro, aunque tengas el
          tema oscuro: están pensados para imprimirse.
        </Note>
      </Section>

      <Section id="instalar" title="Instalarla en el móvil">
        <P>
          JOSEMA RB se instala como una aplicación normal, sin pasar por ninguna
          tienda: la propia portada te lo ofrece. Una vez instalada, lo que ya
          hayas abierto se sigue viendo aunque el gimnasio no tenga cobertura.
        </P>
        <P>
          Tu cliente puede hacer lo mismo con su portal, y le sale su propio
          icono. Son dos aplicaciones distintas: la tuya con tu panel, la suya
          con su enlace.
        </P>
      </Section>

      <Section id="donde-mas" title="Y si algo no cuadra">
        <P>
          Casi todo lo que se ve raro tiene una explicación en su guía: el
          calendario vacío suele ser una{" "}
          <Where href="/ayuda/rutinas">fecha de inicio que falta</Where>, y una
          galería que no se abre suele ser{" "}
          <Where href="/ayuda/seguimiento-corporal">un permiso sin dar</Where>.
        </P>
      </Section>
    </>
  );
}
