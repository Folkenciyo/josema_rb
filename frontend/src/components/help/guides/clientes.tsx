import { Plus, RotateCcw } from "lucide-react";

import {
  Btn,
  Bullets,
  Note,
  OpenScreen,
  P,
  Path,
  Section,
  Step,
  Steps,
  Term,
  Where,
} from "../help-ui";

export function Clientes() {
  return (
    <>
      <P>
        El cliente es el centro de todo: sus planes, su peso, sus fotos y su
        enlace cuelgan de una sola ficha. Esta guía cubre el alta, lo que hay
        dentro de la ficha, los avisos de la portada y qué pasa cuando alguien lo
        deja.
      </P>

      <OpenScreen
        href="/clients"
        label="Abrir Clientes"
        note="El listado, con el buscador y el alta"
      />

      <Section id="alta" title="Dar de alta">
        <Steps>
          <Step title="Pulsa Nuevo cliente">
            El botón <Btn icon={Plus}>Nuevo cliente</Btn> está arriba a la
            derecha del listado.
          </Step>
          <Step title="Rellena lo que sepas">
            Solo el <Term>Nombre completo</Term> es obligatorio. El resto —{" "}
            <Term>Email</Term>, <Term>Teléfono</Term>,{" "}
            <Term>Fecha de nacimiento</Term>, <Term>Sexo</Term>,{" "}
            <Term>Altura (cm)</Term>, <Term>Objetivos</Term> y <Term>Notas</Term>{" "}
            — se puede completar después.
          </Step>
          <Step title="Guarda y entra en su ficha">
            Desde ahí ya puedes montarle el plan o generarle el enlace.
          </Step>
        </Steps>

        <Note>
          Pon la <strong>altura</strong> cuanto antes. Es lo único que hace falta
          para que el IMC se calcule en cada pesaje, y si la corriges más
          adelante se recalcula todo el histórico de golpe.
        </Note>
      </Section>

      <Section id="ficha" title="Qué hay en la ficha">
        <P>
          Se abre pulsando el nombre en el listado. A la izquierda están los
          datos y las herramientas; a la derecha, el trabajo:
        </P>
        <Bullets>
          <li>
            <strong>Datos del cliente</strong> — con el teléfono y el correo
            convertidos en enlaces: se pulsa y se llama, se abre WhatsApp o se
            escribe el correo.
          </li>
          <li>
            <strong>Peso e IMC</strong> — el último pesaje, la gráfica de
            evolución y el alta de pesajes a mano.
          </li>
          <li>
            <strong>Acceso del cliente</strong> — generar, copiar, enviar,
            regenerar o anular su enlace al portal.
          </li>
          <li>
            <strong>Mensaje fijado</strong> — para clavarle un mensaje motivador
            concreto en lugar del que toque ese día.
          </li>
          <li>
            <strong>Planes de entrenamiento</strong> y <strong>Planes de dieta</strong> —
            el historial completo, con el activo destacado.
          </li>
          <li>
            <strong>Calendario de entrenos</strong> y{" "}
            <strong>Sesiones entrenadas</strong> — qué días fue y qué levantó.
          </li>
          <li>
            <strong>Fotos de progreso</strong> y{" "}
            <strong>Progresión por ejercicio</strong>.
          </li>
          <li>
            <strong>Cuestionario</strong> — las respuestas que dejó al entrar por
            primera vez.
          </li>
        </Bullets>
      </Section>

      <Section id="avisos" title="Los avisos de la portada">
        <P>
          <Where href="/dashboard">Inicio</Where> vigila por ti y avisa de cuatro
          cosas, cada una con el cliente al que se refiere:
        </P>
        <Bullets>
          <li>
            <strong>Sin plan activo</strong> — está dado de alta pero no tiene
            rutina publicada.
          </li>
          <li>
            <strong>Planes que se acaban</strong> — la fecha de fin está cerca, o
            ya pasó y el plan sigue marcado como activo.
          </li>
          <li>
            <strong>Sin pesarse</strong> — lleva más de un mes sin registrar
            peso. Los clientes de menos de un mes de antigüedad no cuentan, para
            no llenarte la portada de recién llegados.
          </li>
          <li>
            <strong>Clientes inactivos</strong> — los que diste de baja, por si
            alguno vuelve.
          </li>
        </Bullets>
        <Note>
          No hay aviso de fotos a propósito: las fotos dependen del permiso del
          cliente y de tus revisiones, no de un calendario.
        </Note>
      </Section>

      <Section id="baja" title="Bajas y vueltas">
        <P>
          Dar de baja a un cliente <strong>no borra nada</strong>: sus planes, su
          peso y sus fotos siguen ahí. Simplemente sale del listado normal y deja
          de aparecer en los avisos.
        </P>
        <P>
          Para verlos, marca <Term>Mostrar inactivos</Term> en el listado.
          Para que vuelva, pulsa <Btn icon={RotateCcw} variant="secondary">Reactivar</Btn>{" "}
          en su ficha o directamente desde el aviso de la portada.
        </P>
        <Note kind="warn">
          Un cliente dado de baja <strong>no puede entrar en su portal</strong>:
          su enlace deja de resolver mientras esté inactivo. Al reactivarlo
          vuelve a funcionar el mismo enlace.
        </Note>
      </Section>

      <Section id="buscar" title="Encontrar a alguien rápido">
        <P>
          El listado tiene buscador por nombre, pero desde cualquier pantalla es
          más rápido <Path parts={["Ctrl + K", "escribir el nombre"]} />.
        </P>
      </Section>
    </>
  );
}
