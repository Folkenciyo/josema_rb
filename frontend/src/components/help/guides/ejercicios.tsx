import { EyeOff, Plus, X } from "lucide-react";

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

export function Ejercicios() {
  return (
    <>
      <P>
        La librería viene cargada con cerca de 2.000 ejercicios en español, cada
        uno con sus instrucciones. Los primeros 870 traen fotos; el resto —el
        grueso de máquina, polea y multipower— entra sin imagen y puedes ponerle
        la tuya. Encima de eso puedes añadir los que quieras. Todo lo que montes
        en una rutina sale de aquí.
      </P>

      <OpenScreen
        href="/exercises"
        label="Abrir Ejercicios"
        note="Buscador, filtros y tus propios ejercicios"
      />

      <Section id="buscar" title="Encontrar el que buscas">
        <P>
          Arriba tienes el buscador por nombre y cuatro filtros que se combinan
          entre sí:
        </P>
        <Bullets>
          <li>
            <Term>Músculo</Term> — el que trabaja principalmente.
          </li>
          <li>
            <Term>Equipo</Term> — barra, mancuernas, máquina, peso corporal…
          </li>
          <li>
            <Term>Categoría</Term> — fuerza, estiramiento, cardio…
          </li>
          <li>
            <Term>Nivel</Term> — principiante, intermedio o experto.
          </li>
        </Bullets>
        <P>
          <Btn icon={X} variant="secondary">Limpiar</Btn> quita todos los filtros
          de golpe. Pulsando una tarjeta se abre la ficha completa, con las
          imágenes y el paso a paso.
        </P>
      </Section>

      <Section id="crear" title="Crear un ejercicio tuyo">
        <Steps>
          <Step title="Pulsa Nuevo ejercicio">
            <Btn icon={Plus}>Nuevo ejercicio</Btn>, arriba a la derecha. También
            puedes ir directo a <Where href="/exercises/new">crear uno</Where>.
          </Step>
          <Step title="Ponle nombre y clasifícalo">
            <Term>Nombre</Term> es lo único imprescindible.{" "}
            <Term>Categoría</Term>, <Term>Nivel</Term>, <Term>Equipo</Term>,{" "}
            <Term>Fuerza</Term> y <Term>Mecánica</Term> son los que luego lo
            hacen aparecer en los filtros, así que merece la pena rellenarlos.
          </Step>
          <Step title="Marca los músculos">
            <Term>Músculos principales</Term> y{" "}
            <Term>Músculos secundarios</Term>, elegidos de la misma lista que usa
            el resto de la librería.
          </Step>
          <Step title="Añade fotos y explicación">
            Puedes subir imágenes propias y escribir las{" "}
            <Term>Instrucciones</Term>. Es lo que verá el cliente en su rutina,
            así que ahí es donde se gana claridad.
          </Step>
        </Steps>

        <Note>
          Los ejercicios que creas tú llevan la etiqueta <Term>Propio</Term> y
          aparecen mezclados con los de la librería para que no tengas que
          acordarte de cuál es cuál.
        </Note>
      </Section>

      <Section id="editar-importados" title="Retocar un ejercicio de la librería">
        <P>
          Cualquier ejercicio se puede editar, también los que vienen de la
          librería: cambiarle el nombre por el que usas tú en el gimnasio,
          reescribir las instrucciones, corregir la categoría o{" "}
          <strong>subirle una foto</strong> —parte del catálogo viene sin
          imagen, y lo suyo es la foto de tu propia máquina—.
        </P>
        <Note>
          La primera vez que guardas, ese ejercicio <strong>pasa a ser tuyo</strong>{" "}
          y se marca como <Term>Editado</Term>. A partir de ahí las
          actualizaciones de la librería dejan de tocarlo: lo que escribas tú se
          queda como está.
        </Note>
        <P>
          Lo que no se puede es <strong>borrar</strong> uno de la librería —
          volvería a aparecer la próxima vez que se actualice el catálogo, y
          puede estar en la rutina de alguien—. Para quitarlo de en medio está{" "}
          <Btn icon={EyeOff} variant="secondary">Ocultar</Btn>: desaparece del
          buscador y del selector de rutinas, y las rutinas que ya lo usaban
          siguen igual. Los ocultos se recuperan con{" "}
          <Btn icon={EyeOff} variant="secondary">Ver ocultos</Btn>, arriba a la
          derecha.
        </P>
      </Section>

      <Section id="donde-se-usan" title="Dónde se usan">
        <P>
          Al montar un día de entrenamiento se abre un buscador con estos mismos
          filtros. La imagen y el nombre que tenga aquí el ejercicio son los que
          verá el cliente en su portal y los que salen en el PDF de la rutina.
        </P>
        <Note kind="warn">
          Si borras un ejercicio tuyo que ya estaba en la rutina de alguien, esa
          rutina se queda sin él. Las series que el cliente ya hubiera registrado
          se conservan, porque guardan el nombre con el que las hizo.
        </Note>
      </Section>
    </>
  );
}
