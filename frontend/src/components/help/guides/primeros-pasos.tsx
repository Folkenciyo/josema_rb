import { Plus } from "lucide-react";

import {
  Btn,
  Bullets,
  Kbd,
  Note,
  OpenScreen,
  P,
  Path,
  Section,
  Step,
  Steps,
  Where,
} from "../help-ui";

export function PrimerosPasos() {
  return (
    <>
      <P>
        JOSEMA RB tiene dos mitades. La que estás viendo es <strong>tu panel</strong>:
        aquí montas rutinas, dietas y seguimiento. La otra es{" "}
        <strong>el portal del cliente</strong>, una página propia a la que entra
        con un enlace privado, sin contraseña y sin instalar nada. Todo lo que
        preparas aquí es lo que él ve allí.
      </P>

      <Section id="menu" title="Qué hay en el menú">
        <Bullets>
          <li>
            <Where href="/dashboard">Inicio</Where> — el resumen del día y los
            avisos: quién se queda sin plan, quién lleva tiempo sin pesarse.
          </li>
          <li>
            <Where href="/clients">Clientes</Where> — el listado y, dentro de
            cada uno, su ficha completa: planes, peso, fotos, calendario y su
            enlace.
          </li>
          <li>
            <Where href="/exercises">Ejercicios</Where> — la librería con
            imágenes, en español, más los que crees tú.
          </li>
          <li>
            <Where href="/routines">Rutinas</Where> — plantillas de
            entrenamiento sin dueño, listas para copiar sobre cualquier cliente.
          </li>
          <li>
            <Where href="/foods">Alimentos</Where>,{" "}
            <Where href="/meal-templates">Comidas</Where> y{" "}
            <Where href="/menus">Menús</Where> — los tres pisos con los que se
            construye una dieta.
          </li>
          <li>
            <Where href="/quotes">Motivación</Where> — los mensajes y vídeos que
            tus clientes leen cada día al abrir su portal.
          </li>
          <li>
            <Where href="/settings">Ajustes</Where> — el cuestionario inicial y
            cómo se redacta el mensaje con el que entregas el enlace.
          </li>
        </Bullets>
      </Section>

      <Section id="primer-cliente" title="Tu primer cliente, de principio a fin">
        <P>
          Este es el camino corto. Cada paso tiene su propia guía si quieres el
          detalle.
        </P>
        <Steps>
          <Step title="1. Crea el cliente">
            En <Where href="/clients">Clientes</Where>, con{" "}
            <Btn icon={Plus}>Nuevo cliente</Btn>. Solo el nombre es obligatorio;
            la altura conviene ponerla desde el principio, porque es lo que
            permite calcular el IMC.
          </Step>
          <Step title="2. Móntale la rutina">
            Desde su ficha, en la tarjeta de planes de entrenamiento. Un plan se
            organiza en semanas, y cada semana en días. Si ya tienes una rutina
            que te funciona, cópiala en vez de escribirla otra vez.
          </Step>
          <Step title="3. Móntale la dieta">
            Necesitas alimentos, con ellos montas comidas, con las comidas
            montas menús y a la dieta le asignas un menú por día.
          </Step>
          <Step title="4. Mándale su enlace">
            En su ficha, en la tarjeta del portal. La aplicación te redacta el
            mensaje de WhatsApp o el correo; tú solo lo envías.
          </Step>
          <Step title="5. Sigue su evolución">
            El cliente apunta su peso y sus series desde el móvil, y tú lo ves en
            su ficha: calendario de entrenos, progresión por ejercicio, gráfica
            de peso y fotos.
          </Step>
        </Steps>

        <OpenScreen
          href="/clients"
          label="Ir a Clientes"
          note="El sitio donde empieza casi todo"
        />
      </Section>

      <Section id="quien-ve-que" title="Quién ve qué">
        <P>
          El cliente <strong>solo ve lo suyo</strong>, y solo la parte publicada:
          la rutina y la dieta que tengan estado <em>Activo</em>. Un plan en
          borrador es tuyo hasta que lo actives. Tampoco ve tus notas internas ni
          nada de los demás clientes.
        </P>
        <P>
          Y solo puede escribir tres cosas: su peso de hoy, las series que
          entrena y el cuestionario inicial. El resto es de lectura.
        </P>
        <Note>
          El enlace no lleva contraseña, así que quien lo tenga entra. Si un
          cliente lo pierde o lo reenvía a quien no debe, genera uno nuevo desde
          su ficha: el anterior deja de funcionar en el acto.
        </Note>
      </Section>

      <Section id="donde-estoy" title="Moverte rápido">
        <P>
          Pulsa <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> en cualquier pantalla (en Mac,{" "}
          <Kbd>⌘</Kbd> + <Kbd>K</Kbd>) y escribe: salta a un cliente, un
          ejercicio, un alimento, una comida o un menú sin pasar por el menú.
        </P>
        <P>
          El resto de la interfaz está siempre en el mismo sitio:{" "}
          <Path parts={["Menú lateral", "Sección", "Ficha o editor"]} />.
        </P>
      </Section>
    </>
  );
}
