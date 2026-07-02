const translations = {
  // Navbar
  "nav.features": { en: "Features", es: "Características" },
  "nav.pricing": { en: "Pricing", es: "Precios" },
  "nav.openSource": { en: "Open Source", es: "Código Abierto" },
  "nav.faq": { en: "FAQ", es: "Preguntas Frecuentes" },
  "nav.getStarted": { en: "Get Started", es: "Comenzar" },
  "nav.signIn": { en: "Log In", es: "Iniciar Sesión" },

  // Hero
  "hero.headline": {
    en: "Manage all your clients' support in one place",
    es: "Gestiona el soporte de todos tus clientes en un solo lugar",
  },
  "hero.subheadline": {
    en: "Open-source helpdesk with built-in multi-tenant support. Perfect for MSPs, agencies, and teams managing multiple clients. Self-host or use our cloud.",
    es: "Helpdesk open-source con soporte multi-tenant integrado. Perfecto para MSPs, agencias y equipos que gestionan múltiples clientes. Self-host o usa nuestra nube.",
  },
  "hero.cta": { en: "Start Free Trial", es: "Comienza tu Prueba Gratis" },
  "hero.trialNote": { en: "14 days free. No credit card needed.", es: "14 días gratis. Sin tarjeta de crédito." },
  "hero.github": { en: "Deploy Self-Hosted", es: "Desplegar Self-Hosted" },

  // Social Proof
  "social.openSource": { en: "Open Source", es: "Código Abierto" },
  "social.license": { en: "AGPL-3.0", es: "AGPL-3.0" },
  "social.stars": { en: "GitHub Stars", es: "Estrellas en GitHub" },
  "social.teams": {
    en: "Built for teams who manage support at scale",
    es: "Creado para equipos que gestionan soporte a escala",
  },

  // Problem (new section)
  "problem.heading": {
    en: "Managing support across multiple clients is messy",
    es: "Gestionar soporte para varios clientes es un caos",
  },
  "problem.p1.title": {
    en: "Separate tools per client",
    es: "Herramientas separadas por cliente",
  },
  "problem.p1.desc": {
    en: "Juggling multiple inboxes, portals, or spreadsheets for each client wastes hours every week.",
    es: "Malabarear entre buzones, portales o hojas de cálculo por cada cliente desperdicia horas cada semana.",
  },
  "problem.p2.title": {
    en: "No isolation between teams",
    es: "Sin aislamiento entre equipos",
  },
  "problem.p2.desc": {
    en: "Shared helpdesks mix client data, creating security risks and confusion for your agents.",
    es: "Los helpdesks compartidos mezclan datos de clientes, creando riesgos de seguridad y confusión.",
  },
  "problem.p3.title": {
    en: "Expensive per-agent pricing eats your margins",
    es: "El alto costo por agente se come tus márgenes",
  },
  "problem.p3.desc": {
    en: "Most helpdesks charge $25-85 per agent per month. With 10 technicians, that's $250-850/mo just for ticketing. Open Helpdesk includes seats in every plan — extras at just $9/mo each.",
    es: "La mayoría de helpdesks cobran $25-85 por agente al mes. Con 10 técnicos, son $250-850/mes solo por ticketing. Open Helpdesk incluye asientos en cada plan — extras a solo $9/mes cada uno.",
  },

  // Solution (new section)
  "solution.heading": {
    en: "One platform for all your clients",
    es: "Una plataforma para todos tus clientes",
  },
  "solution.subheading": {
    en: "Open Helpdesk gives you a unified system to manage support across multiple client environments — without mixing data or workflows.",
    es: "Open Helpdesk te da un sistema unificado para gestionar soporte en múltiples entornos de clientes — sin mezclar datos ni flujos de trabajo.",
  },
  "solution.s1.title": {
    en: "Workspaces = Clients",
    es: "Workspaces = Clientes",
  },
  "solution.s1.desc": {
    en: "Each client gets their own isolated workspace with dedicated tickets, agents, settings, and branding.",
    es: "Cada cliente tiene su propio workspace aislado con tickets, agentes, configuración y branding dedicados.",
  },
  "solution.s2.title": {
    en: "Agents shared or isolated",
    es: "Agentes compartidos o aislados",
  },
  "solution.s2.desc": {
    en: "Assign technicians to specific clients or share them across workspaces. Full role-based access control with 26 granular permissions.",
    es: "Asigna técnicos a clientes específicos o compártelos entre workspaces. Control de acceso completo con 26 permisos granulares.",
  },
  "solution.s3.title": {
    en: "Full data separation",
    es: "Separación total de datos",
  },
  "solution.s3.desc": {
    en: "Tickets, comments, attachments, audit logs — everything is scoped per workspace. No data leaks between clients.",
    es: "Tickets, comentarios, adjuntos, logs de auditoría — todo está delimitado por workspace. Sin fugas de datos entre clientes.",
  },
  "solution.s4.title": {
    en: "Centralized control panel",
    es: "Panel de control centralizado",
  },
  "solution.s4.desc": {
    en: "Switch between client workspaces instantly. One dashboard to manage all your operations.",
    es: "Cambia entre workspaces de clientes al instante. Un dashboard para gestionar todas tus operaciones.",
  },

  // Features
  "features.heading": {
    en: "Everything you need to operate at scale",
    es: "Todo lo que necesitas para operar a escala",
  },
  "features.subheading": {
    en: "Built for service teams managing multiple clients, not just one inbox.",
    es: "Creado para equipos de servicio que gestionan múltiples clientes, no solo una bandeja de entrada.",
  },
  "features.tickets.title": { en: "Tickets", es: "Tickets" },
  "features.tickets.desc": {
    en: "Create, assign, and track support tickets with priorities, statuses, and categories.",
    es: "Crea, asigna y da seguimiento a tickets con prioridades, estados y categorías.",
  },
  "features.reports.title": { en: "Reports & Analytics", es: "Reportes y Analíticas" },
  "features.reports.desc": {
    en: "Visual dashboard with resolution times, agent performance, and trend charts.",
    es: "Dashboard visual con tiempos de resolución, rendimiento de agentes y tendencias.",
  },
  "features.csat.title": { en: "CSAT Surveys", es: "Encuestas de Satisfacción" },
  "features.csat.desc": {
    en: "Automatic satisfaction surveys after resolution — one-click rating, no login required.",
    es: "Encuestas automáticas de satisfacción al resolver — calificación con un click, sin login.",
  },
  "features.canned.title": { en: "Canned Responses", es: "Respuestas Predefinidas" },
  "features.canned.desc": {
    en: "Reusable reply templates your team inserts with \"/\" while writing comments.",
    es: "Plantillas de respuesta reutilizables que tu equipo inserta con \"/\" al escribir.",
  },
  "features.customFields.title": { en: "Custom Fields", es: "Campos Personalizados" },
  "features.customFields.desc": {
    en: "Add your own fields to tickets — text, dropdowns, dates, checkboxes, and more.",
    es: "Agrega tus propios campos a tickets — texto, selección, fechas, casillas y más.",
  },
  "features.workspaces.title": { en: "Workspaces", es: "Workspaces" },
  "features.workspaces.desc": {
    en: "Separate teams, departments, or clients into independent workspaces with their own settings.",
    es: "Separa equipos, departamentos o clientes en workspaces independientes con su propia configuración.",
  },
  "features.auditLog.title": { en: "Audit Log", es: "Registro de Auditoría" },
  "features.auditLog.desc": {
    en: "Full traceability of every action — who changed what, when, and why.",
    es: "Trazabilidad completa de cada acción — quién cambió qué, cuándo y por qué.",
  },
  "features.selfHosted.title": { en: "Self-hosted", es: "Self-hosted" },
  "features.selfHosted.desc": {
    en: "Deploy on your own servers with Docker. Your data stays yours — no vendor lock-in.",
    es: "Despliega en tus propios servidores con Docker. Tus datos son tuyos — sin dependencia de terceros.",
  },
  "features.api.title": { en: "REST API", es: "REST API" },
  "features.api.desc": {
    en: "Integrate with any external system. Automate workflows and extend functionality via API.",
    es: "Integra con cualquier sistema externo. Automatiza flujos y extiende funcionalidad vía API.",
  },
  "features.emailToTicket.title": { en: "Email-to-Ticket", es: "Email-to-Ticket" },
  "features.emailToTicket.desc": {
    en: "Turn incoming emails into tickets automatically. Connect any IMAP mailbox — replies thread into the conversation.",
    es: "Convierte emails entrantes en tickets automáticamente. Conecta cualquier buzón IMAP — las respuestas se hilan en la conversación.",
  },
  "features.customerPortal.title": { en: "Customer Portal", es: "Portal de Clientes" },
  "features.customerPortal.desc": {
    en: "Public ticket submission form — no login required. Customers track progress via magic link and get email updates.",
    es: "Formulario público de tickets — sin login. Los clientes siguen el progreso vía magic link y reciben actualizaciones por email.",
  },
  "features.sla.title": { en: "SLA Tracking", es: "Seguimiento de SLAs" },
  "features.sla.desc": {
    en: "Set response and resolution targets per priority. Real-time breach detection with compliance metrics in reports.",
    es: "Define objetivos de respuesta y resolución por prioridad. Detección de incumplimientos en tiempo real con métricas de cumplimiento.",
  },

  // Product Showcase
  "showcase.heading": { en: "See it in action", es: "Míralo en acción" },
  "showcase.subheading": {
    en: "A clean, intuitive interface that your team will love from day one.",
    es: "Una interfaz limpia e intuitiva que tu equipo amará desde el día uno.",
  },
  "showcase.lightTheme": { en: "Light", es: "Claro" },
  "showcase.darkTheme": { en: "Dark", es: "Oscuro" },

  // Pricing
  "pricing.heading": {
    en: "Simple, transparent pricing",
    es: "Precios simples y transparentes",
  },
  "pricing.subheading": {
    en: "Start free, scale as you grow. No hidden fees.",
    es: "Comienza gratis, escala a medida que creces. Sin costos ocultos.",
  },
  "pricing.monthly": { en: "Monthly", es: "Mensual" },
  "pricing.yearly": { en: "Yearly", es: "Anual" },
  "pricing.yearlyDiscount": { en: "Save 2 months", es: "Ahorra 2 meses" },
  "pricing.perMonth": { en: "/mo", es: "/mes" },
  "pricing.perYear": { en: "/yr", es: "/año" },
  "pricing.comingSoon": { en: "Coming Soon", es: "Próximamente" },

  "pricing.free.name": { en: "Free", es: "Gratis" },
  "pricing.free.desc": {
    en: "For individuals and small projects",
    es: "Para individuos y proyectos pequeños",
  },
  "pricing.free.cta": { en: "Get Started", es: "Comenzar" },
  "pricing.free.f1": { en: "Up to 2 agents", es: "Hasta 2 agentes" },
  "pricing.free.f2": { en: "1 workspace", es: "1 workspace" },
  "pricing.free.f3": { en: "Unlimited tickets", es: "Tickets ilimitados" },
  "pricing.free.f4": { en: "Reports & custom fields", es: "Reportes y campos personalizados" },
  "pricing.free.f5": { en: "Email-to-Ticket", es: "Email-to-Ticket" },
  "pricing.free.f6": { en: "Google & Microsoft sign-in", es: "Inicio de sesión con Google y Microsoft" },

  "pricing.starter.name": { en: "Starter", es: "Starter" },
  "pricing.starter.desc": {
    en: "For small teams and MSPs",
    es: "Para equipos pequeños y MSPs",
  },
  "pricing.starter.cta": { en: "Get Started", es: "Comenzar" },
  "pricing.starter.trial": { en: "14-day free trial — no credit card", es: "14 días gratis — sin tarjeta" },
  "pricing.starter.f1": { en: "Everything in Free", es: "Todo lo de Free" },
  "pricing.starter.f2": { en: "Up to 5 agents", es: "Hasta 5 agentes" },
  "pricing.starter.f3": { en: "3 workspaces", es: "3 workspaces" },
  "pricing.starter.f4": { en: "CSAT surveys", es: "Encuestas de satisfacción" },
  "pricing.starter.f5": { en: "Custom color palette", es: "Paleta de colores personalizada" },
  "pricing.starter.f6": { en: "SLA tracking", es: "Seguimiento de SLAs" },
  "pricing.starter.f7": { en: "Canned responses", es: "Respuestas predefinidas" },

  "pricing.business.name": { en: "Business", es: "Negocio" },
  "pricing.business.desc": {
    en: "For growing service teams",
    es: "Para equipos de servicio en crecimiento",
  },
  "pricing.business.cta": { en: "Get Started", es: "Comenzar" },
  "pricing.business.trial": { en: "14-day free trial — no credit card", es: "14 días gratis — sin tarjeta" },
  "pricing.business.f1": { en: "Everything in Starter", es: "Todo lo de Starter" },
  "pricing.business.f2": { en: "Up to 20 agents", es: "Hasta 20 agentes" },
  "pricing.business.f3": { en: "10 workspaces", es: "10 workspaces" },
  "pricing.business.f4": { en: "Audit log", es: "Registro de auditoría" },
  "pricing.business.f5": { en: "Advanced reports & analytics", es: "Reportes y analíticas avanzados" },
  "pricing.business.f6": { en: "Custom email mailboxes", es: "Buzones de email personalizados" },

  "pricing.enterprise.name": { en: "Enterprise", es: "Empresarial" },
  "pricing.enterprise.desc": {
    en: "For large organizations",
    es: "Para grandes organizaciones",
  },
  "pricing.enterprise.cta": { en: "Contact Us", es: "Contáctanos" },
  "pricing.enterprise.f1": { en: "Everything in Business", es: "Todo lo de Negocio" },
  "pricing.enterprise.f2": { en: "Custom agent & workspace limits", es: "Límites personalizados de agentes y workspaces" },
  "pricing.enterprise.f3": { en: "Dedicated setup assistance", es: "Asistencia dedicada de configuración" },
  "pricing.enterprise.f4": { en: "Volume pricing", es: "Precios por volumen" },

  // Open Source
  "oss.heading": { en: "Open Source at heart", es: "Open Source de corazón" },
  "oss.subheading": {
    en: "Built in the open. Deploy anywhere. Contribute freely.",
    es: "Construido abiertamente. Despliega donde quieras. Contribuye libremente.",
  },
  "oss.agpl.title": { en: "AGPL-3.0 Licensed", es: "Licencia AGPL-3.0" },
  "oss.agpl.desc": {
    en: "Your freedom to use, modify, and distribute is guaranteed. The code stays open forever.",
    es: "Tu libertad de usar, modificar y distribuir está garantizada. El código permanece abierto para siempre.",
  },
  "oss.selfHost.title": {
    en: "Self-host in minutes",
    es: "Auto-hospeda en minutos",
  },
  "oss.selfHost.desc": {
    en: "One command to run. Docker Compose handles the rest. Your data, your servers.",
    es: "Un comando para correr. Docker Compose se encarga del resto. Tus datos, tus servidores.",
  },
  "oss.contribute.title": { en: "Contribute", es: "Contribuye" },
  "oss.contribute.desc": {
    en: "PRs welcome. Join the community and help shape the future of helpdesk software.",
    es: "PRs bienvenidos. Únete a la comunidad y ayuda a moldear el futuro del software de helpdesk.",
  },
  "oss.starOnGithub": { en: "Star on GitHub", es: "Dar estrella en GitHub" },

  // FAQ
  "faq.heading": {
    en: "Frequently asked questions",
    es: "Preguntas frecuentes",
  },
  "faq.subheading": {
    en: "Everything you need to know about Open Helpdesk.",
    es: "Todo lo que necesitas saber sobre Open Helpdesk.",
  },
  "faq.q1": {
    en: "Is Open Helpdesk really free?",
    es: "Es Open Helpdesk realmente gratis?",
  },
  "faq.a1": {
    en: "Yes! The core product is free and open-source under AGPL-3.0. You can self-host it at no cost. We offer paid cloud plans for teams who need more agents, workspaces, and advanced features.",
    es: "Sí! El producto principal es gratuito y open-source bajo AGPL-3.0. Puedes auto-hospedarlo sin costo. Ofrecemos planes cloud de pago para equipos que necesiten más agentes, workspaces y funcionalidades avanzadas.",
  },
  "faq.q2": { en: "Can I self-host it?", es: "Puedo auto-hospedarlo?" },
  "faq.a2": {
    en: "Absolutely. We provide Docker images and a docker-compose file that gets you running in under 5 minutes. Deploy on any VPS, Kubernetes cluster, or bare metal server.",
    es: "Absolutamente. Proveemos imágenes Docker y un archivo docker-compose que te permite correr en menos de 5 minutos. Despliega en cualquier VPS, cluster de Kubernetes o servidor bare metal.",
  },
  "faq.q3": {
    en: "How is it different from other helpdesks?",
    es: "En qué se diferencia de otros helpdesks?",
  },
  "faq.a3": {
    en: "Most helpdesks are single-tenant and charge per agent. Open Helpdesk has multi-workspace built in — each client or team gets isolated tickets, agents, and data. Plans include seats with $9/mo extras instead of $55+/agent. Plus it's open-source: self-host it or use our cloud.",
    es: "La mayoría de helpdesks son single-tenant y cobran por agente. Open Helpdesk tiene multi-workspace integrado — cada cliente o equipo tiene tickets, agentes y datos aislados. Los planes incluyen asientos con extras de $9/mes en vez de $55+/agente. Además es open-source: self-host o usa nuestra nube.",
  },
  "faq.q4": {
    en: "What's included in the free plan?",
    es: "Qué incluye el plan gratuito?",
  },
  "faq.a4": {
    en: "Up to 2 agents, 1 workspace, full ticket management, reports, custom fields, email-to-ticket, and email notifications. No feature gating on the essentials.",
    es: "Hasta 2 agentes, 1 workspace, gestión completa de tickets, reportes, campos personalizados, email-to-ticket y notificaciones por email. Sin limitaciones en lo esencial.",
  },
  "faq.q5": {
    en: "Can I upgrade or downgrade anytime?",
    es: "Puedo actualizar o bajar de plan en cualquier momento?",
  },
  "faq.a5": {
    en: "Yes. Change plans at any time. When downgrading, your current billing period continues until it expires. No lock-in, no penalties.",
    es: "Sí. Cambia de plan en cualquier momento. Al bajar de plan, tu período de facturación actual continúa hasta que expire. Sin permanencia, sin penalizaciones.",
  },
  "faq.q6": { en: "Is my data secure?", es: "Mis datos están seguros?" },
  "faq.a6": {
    en: "Security is a top priority. We use encryption in transit (TLS), role-based access control, and follow security best practices. Self-hosted users have full control over their data.",
    es: "La seguridad es prioridad. Usamos encriptación en tránsito (TLS), control de acceso basado en roles y seguimos las mejores prácticas de seguridad. Los usuarios self-hosted tienen control total sobre sus datos.",
  },

  // CTA Footer
  "cta.heading": {
    en: "Start managing all your clients from one platform",
    es: "Empieza a gestionar todos tus clientes desde una plataforma",
  },
  "cta.subheading": {
    en: "Join teams who switched from scattered tools to a unified helpdesk.",
    es: "Únete a equipos que cambiaron de herramientas dispersas a un helpdesk unificado.",
  },
  "cta.getStarted": { en: "Get Started Free", es: "Comenzar Gratis" },
  "cta.talkToUs": { en: "Talk to Us", es: "Habla con Nosotros" },

  // Footer
  "footer.product": { en: "Product", es: "Producto" },
  "footer.features": { en: "Features", es: "Características" },
  "footer.pricing": { en: "Pricing", es: "Precios" },
  "footer.changelog": { en: "Changelog", es: "Changelog" },
  "footer.resources": { en: "Resources", es: "Recursos" },
  "footer.docs": { en: "Documentation", es: "Documentación" },
  "footer.github": { en: "GitHub", es: "GitHub" },
  "footer.community": { en: "Community", es: "Comunidad" },
  "footer.company": { en: "Company", es: "Compañía" },
  "footer.about": { en: "About", es: "Acerca de" },
  "footer.blog": { en: "Blog", es: "Blog" },
  "footer.contact": { en: "Contact", es: "Contacto" },
  "footer.legal": { en: "Legal", es: "Legal" },
  "footer.privacy": { en: "Privacy", es: "Privacidad" },
  "footer.terms": { en: "Terms", es: "Términos" },
  "footer.refund": { en: "Refund Policy", es: "Reembolsos" },
  "footer.license": { en: "License", es: "Licencia" },
  "footer.rights": {
    en: "All rights reserved.",
    es: "Todos los derechos reservados.",
  },

  // Misc
  popular: { en: "Popular", es: "Popular" },
  mostPopular: { en: "Most Popular", es: "Más Popular" },
  custom: { en: "—", es: "—" },

  // Privacy Policy
  "privacy.title": { en: "Privacy Policy", es: "Política de Privacidad" },
  "privacy.lastUpdated": {
    en: "Last updated: April 2026",
    es: "Última actualización: Abril 2026",
  },
  "privacy.intro": {
    en: 'Open Helpdesk ("we", "us", "our") operates the openhelpdesk.dev website and the Open Helpdesk cloud platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service.',
    es: 'Open Helpdesk ("nosotros") opera el sitio web openhelpdesk.dev y la plataforma cloud Open Helpdesk. Esta página le informa sobre nuestras políticas con respecto a la recopilación, uso y divulgación de datos personales cuando utiliza nuestro servicio.',
  },
  "privacy.collect.title": {
    en: "Information We Collect",
    es: "Información que Recopilamos",
  },
  "privacy.collect.desc": {
    en: "When you create an account, we collect your name, email address, and password (stored hashed). When you use the platform, we collect ticket data, comments, attachments, and usage metadata necessary to provide the service.",
    es: "Cuando crea una cuenta, recopilamos su nombre, dirección de email y contraseña (almacenada hasheada). Cuando usa la plataforma, recopilamos datos de tickets, comentarios, adjuntos y metadatos de uso necesarios para proveer el servicio.",
  },
  "privacy.use.title": {
    en: "How We Use Your Data",
    es: "Cómo Usamos sus Datos",
  },
  "privacy.use.desc": {
    en: "We use your data solely to provide and improve the Open Helpdesk service. We do not sell, rent, or share your personal data with third parties for marketing purposes. Data is used for: account management, service delivery, email notifications you opted into, and aggregate analytics.",
    es: "Usamos sus datos únicamente para proveer y mejorar el servicio Open Helpdesk. No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines de marketing. Los datos se usan para: gestión de cuenta, prestación del servicio, notificaciones por email que aceptó, y analíticas agregadas.",
  },
  "privacy.storage.title": {
    en: "Data Storage & Security",
    es: "Almacenamiento y Seguridad",
  },
  "privacy.storage.desc": {
    en: "Your data is stored on secure servers with encryption in transit (TLS). We use industry-standard security practices including role-based access control and regular backups. Self-hosted users maintain full control over their own data.",
    es: "Sus datos se almacenan en servidores seguros con encriptación en tránsito (TLS). Usamos prácticas de seguridad estándar de la industria incluyendo control de acceso basado en roles y respaldos regulares. Los usuarios self-hosted mantienen control total sobre sus propios datos.",
  },
  "privacy.rights.title": { en: "Your Rights", es: "Sus Derechos" },
  "privacy.rights.desc": {
    en: "You have the right to access, correct, or delete your personal data at any time. You can export your data or request account deletion by contacting us. Upon deletion, all your data is permanently removed from our systems within 30 days.",
    es: "Tiene derecho a acceder, corregir o eliminar sus datos personales en cualquier momento. Puede exportar sus datos o solicitar la eliminación de su cuenta contactándonos. Tras la eliminación, todos sus datos se borran permanentemente de nuestros sistemas en un plazo de 30 días.",
  },
  "privacy.cookies.title": { en: "Cookies", es: "Cookies" },
  "privacy.cookies.desc": {
    en: "We use essential cookies only for authentication and language preferences. We do not use tracking cookies or third-party analytics. No data is shared with advertisers.",
    es: "Usamos cookies esenciales solo para autenticación y preferencias de idioma. No usamos cookies de seguimiento ni analíticas de terceros. No se comparten datos con anunciantes.",
  },
  "privacy.contact.title": { en: "Contact", es: "Contacto" },
  "privacy.contact.desc": {
    en: "If you have any questions about this Privacy Policy, please contact us at",
    es: "Si tiene alguna pregunta sobre esta Política de Privacidad, contáctenos en",
  },

  // Terms of Service
  "terms.title": { en: "Terms of Service", es: "Términos de Servicio" },
  "terms.lastUpdated": {
    en: "Last updated: April 2026",
    es: "Última actualización: Abril 2026",
  },
  "terms.intro": {
    en: "These Terms of Service govern your use of the Open Helpdesk platform and website operated by Open Helpdesk. By accessing or using our service, you agree to be bound by these terms.",
    es: "Estos Términos de Servicio rigen el uso de la plataforma y sitio web Open Helpdesk operado por Open Helpdesk. Al acceder o usar nuestro servicio, acepta estar sujeto a estos términos.",
  },
  "terms.service.title": { en: "The Service", es: "El Servicio" },
  "terms.service.desc": {
    en: "Open Helpdesk provides a helpdesk and ticket management platform available as a cloud-hosted service or self-hosted deployment. We reserve the right to modify, suspend, or discontinue any part of the service with reasonable notice.",
    es: "Open Helpdesk proporciona una plataforma de helpdesk y gestión de tickets disponible como servicio cloud o despliegue self-hosted. Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del servicio con aviso razonable.",
  },
  "terms.accounts.title": { en: "Accounts", es: "Cuentas" },
  "terms.accounts.desc": {
    en: "You are responsible for maintaining the security of your account and password. You must be at least 16 years old to use the service. You are responsible for all activity that occurs under your account.",
    es: "Es responsable de mantener la seguridad de su cuenta y contraseña. Debe tener al menos 16 años para usar el servicio. Es responsable de toda actividad que ocurra bajo su cuenta.",
  },
  "terms.payment.title": { en: "Payment & Plans", es: "Pagos y Planes" },
  "terms.payment.desc": {
    en: "Paid plans are billed monthly or yearly in advance. You may upgrade or downgrade at any time. Downgrade changes take effect at the end of the current billing period. Refunds are handled on a case-by-case basis.",
    es: "Los planes de pago se facturan mensual o anualmente por adelantado. Puede actualizar o bajar de plan en cualquier momento. Los cambios de bajada toman efecto al final del período de facturación actual. Los reembolsos se manejan caso por caso.",
  },
  "terms.content.title": { en: "Your Content", es: "Su Contenido" },
  "terms.content.desc": {
    en: "You retain all rights to the data you upload to Open Helpdesk. We do not claim ownership of your content. You grant us a limited license to store, process, and display your content solely to provide the service.",
    es: "Retiene todos los derechos sobre los datos que sube a Open Helpdesk. No reclamamos propiedad sobre su contenido. Nos otorga una licencia limitada para almacenar, procesar y mostrar su contenido únicamente para proveer el servicio.",
  },
  "terms.acceptable.title": { en: "Acceptable Use", es: "Uso Aceptable" },
  "terms.acceptable.desc": {
    en: "You agree not to use the service for any unlawful purpose, to abuse or harass others, to transmit malware, or to attempt to gain unauthorized access to other systems. We reserve the right to terminate accounts that violate these terms.",
    es: "Acepta no usar el servicio para fines ilegales, abusar o acosar a otros, transmitir malware, o intentar obtener acceso no autorizado a otros sistemas. Nos reservamos el derecho de terminar cuentas que violen estos términos.",
  },
  "terms.liability.title": {
    en: "Limitation of Liability",
    es: "Limitación de Responsabilidad",
  },
  "terms.liability.desc": {
    en: 'The service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Open Helpdesk shall not be liable for any indirect, incidental, or consequential damages arising from the use of the service.',
    es: 'El servicio se proporciona "tal cual" sin garantías de ningún tipo. En la máxima medida permitida por la ley, Open Helpdesk no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del servicio.',
  },
  "terms.changes.title": {
    en: "Changes to Terms",
    es: "Cambios a los Términos",
  },
  "terms.changes.desc": {
    en: "We may update these terms from time to time. We will notify registered users of significant changes via email. Continued use of the service after changes constitutes acceptance of the new terms.",
    es: "Podemos actualizar estos términos periódicamente. Notificaremos a usuarios registrados sobre cambios significativos por email. El uso continuado del servicio después de los cambios constituye la aceptación de los nuevos términos.",
  },
  "terms.contact.title": { en: "Contact", es: "Contacto" },
  "terms.contact.desc": {
    en: "If you have any questions about these Terms of Service, please contact us at",
    es: "Si tiene alguna pregunta sobre estos Términos de Servicio, contáctenos en",
  },

  // Refund Policy
  "refund.title": { en: "Refund Policy", es: "Política de Reembolso" },
  "refund.lastUpdated": {
    en: "Last updated: May 2026",
    es: "Última actualización: Mayo 2026",
  },
  "refund.intro": {
    en: "We want you to be satisfied with Open Helpdesk. This policy outlines the conditions under which we offer refunds for our paid subscription plans.",
    es: "Queremos que esté satisfecho con Open Helpdesk. Esta política describe las condiciones bajo las cuales ofrecemos reembolsos para nuestros planes de suscripción de pago.",
  },
  "refund.eligibility.title": {
    en: "Refund Eligibility",
    es: "Elegibilidad para Reembolso",
  },
  "refund.eligibility.desc": {
    en: "You may request a full refund within 14 days of your initial purchase or plan upgrade if the service does not meet your expectations. Refund requests after the 14-day period are evaluated on a case-by-case basis.",
    es: "Puede solicitar un reembolso completo dentro de los 14 días posteriores a su compra inicial o mejora de plan si el servicio no cumple con sus expectativas. Las solicitudes de reembolso después del período de 14 días se evalúan caso por caso.",
  },
  "refund.process.title": {
    en: "How to Request a Refund",
    es: "Cómo Solicitar un Reembolso",
  },
  "refund.process.desc": {
    en: "To request a refund, contact us at support@openhelpdesk.dev with your account email and the reason for your request. We will process eligible refunds within 5-10 business days. Refunds are returned to the original payment method.",
    es: "Para solicitar un reembolso, contáctenos en support@openhelpdesk.dev con el email de su cuenta y el motivo de su solicitud. Procesaremos los reembolsos elegibles en un plazo de 5 a 10 días hábiles. Los reembolsos se devuelven al método de pago original.",
  },
  "refund.exceptions.title": {
    en: "Non-Refundable Cases",
    es: "Casos No Reembolsables",
  },
  "refund.exceptions.desc": {
    en: "Refunds are not available for: partial months of service after the 14-day period, accounts terminated for violations of our Terms of Service, or voluntary downgrades to the Free plan (which take effect immediately with no prorated refund).",
    es: "No se ofrecen reembolsos por: meses parciales de servicio después del período de 14 días, cuentas terminadas por violación de nuestros Términos de Servicio, o bajadas voluntarias al plan Free (que toman efecto inmediato sin reembolso prorrateado).",
  },
  "refund.downgrade.title": {
    en: "Plan Changes & Cancellations",
    es: "Cambios de Plan y Cancelaciones",
  },
  "refund.downgrade.desc": {
    en: "When you cancel a paid plan, you are downgraded to the Free plan. You retain access to paid features until the end of your current billing period. No partial refunds are issued for unused time after the 14-day refund window.",
    es: "Al cancelar un plan de pago, se le baja al plan Free. Conserva acceso a las funcionalidades de pago hasta el final de su período de facturación actual. No se emiten reembolsos parciales por tiempo no utilizado después de la ventana de reembolso de 14 días.",
  },
  "refund.contact.title": { en: "Contact", es: "Contacto" },
  "refund.contact.desc": {
    en: "If you have any questions about this Refund Policy, please contact us at",
    es: "Si tiene alguna pregunta sobre esta Política de Reembolso, contáctenos en",
  },

  // Pricing Page (dedicated /pricing route)
  "pricingPage.title": {
    en: "Open Helpdesk Pricing — Plans for Every Team",
    es: "Precios de Open Helpdesk — Planes para Cada Equipo",
  },
  "pricingPage.headline": {
    en: "Stop overpaying for helpdesk software",
    es: "Deja de pagar de más por software de helpdesk",
  },
  "pricingPage.subheadline": {
    en: "Most helpdesks charge $25-85 per agent. Open Helpdesk starts free — and stays affordable as you grow.",
    es: "La mayoría de helpdesks cobran $25-85 por agente. Open Helpdesk empieza gratis — y se mantiene accesible mientras creces.",
  },
  "pricingPage.compare.heading": {
    en: "How we compare",
    es: "Cómo nos comparamos",
  },
  "pricingPage.compare.subheading": {
    en: "See how Open Helpdesk stacks up against other helpdesk solutions.",
    es: "Mira cómo Open Helpdesk se compara con otras soluciones de helpdesk.",
  },
  "pricingPage.compare.feature": { en: "Feature", es: "Característica" },
  "pricingPage.compare.openHelpdesk": { en: "Open Helpdesk", es: "Open Helpdesk" },
  "pricingPage.compare.competitors": { en: "Others", es: "Otros" },
  "pricingPage.compare.startingPrice": { en: "Starting price", es: "Precio inicial" },
  "pricingPage.compare.startingPriceUs": { en: "Free", es: "Gratis" },
  "pricingPage.compare.startingPriceThem": { en: "$15-25/agent/mo", es: "$15-25/agente/mes" },
  "pricingPage.compare.openSource": { en: "Open source", es: "Código abierto" },
  "pricingPage.compare.selfHosted": { en: "Self-hosted option", es: "Opción self-hosted" },
  "pricingPage.compare.unlimitedTickets": { en: "Unlimited tickets", es: "Tickets ilimitados" },
  "pricingPage.compare.noPerTicketFees": { en: "No per-ticket fees", es: "Sin cobro por ticket" },
  "pricingPage.compare.multiWorkspace": { en: "Multi-workspace", es: "Multi-workspace" },
  "pricingPage.compare.reports": { en: "Reports & analytics", es: "Reportes y analíticas" },
  "pricingPage.compare.csat": { en: "CSAT surveys", es: "Encuestas CSAT" },
  "pricingPage.compare.customFields": { en: "Custom fields", es: "Campos personalizados" },
  "pricingPage.compare.cannedResponses": { en: "Canned responses", es: "Respuestas predefinidas" },
  "pricingPage.compare.customMailbox": { en: "Custom email mailboxes", es: "Buzones de email personalizados" },
  "pricingPage.compare.advancedReports": { en: "Advanced reports", es: "Reportes avanzados" },
  "pricingPage.compare.auditLog": { en: "Audit log", es: "Registro de auditoría" },
  "pricingPage.compare.fromBusiness": { en: "From Business", es: "Desde Business" },
  "pricingPage.compare.emailToTicket": { en: "Email-to-Ticket", es: "Email-to-Ticket" },
  "pricingPage.compare.customerPortal": { en: "Customer portal", es: "Portal de clientes" },
  "pricingPage.compare.sla": { en: "SLA tracking", es: "Seguimiento de SLAs" },
  "pricingPage.compare.fromStarter": { en: "From Starter", es: "Desde Starter" },
  "pricingPage.compare.yes": { en: "Yes", es: "Sí" },
  "pricingPage.compare.no": { en: "No", es: "No" },
  "pricingPage.compare.varies": { en: "Varies", es: "Varía" },
  "pricingPage.compare.paidOnly": { en: "Paid only", es: "Solo de pago" },
  "pricingPage.compare.limited": { en: "Limited", es: "Limitado" },
  "pricingPage.selfHosted.heading": {
    en: "Prefer to self-host?",
    es: "Prefieres auto-hospedarlo?",
  },
  "pricingPage.selfHosted.desc": {
    en: "Open Helpdesk is 100% open source under AGPL-3.0. Deploy on your own servers with Docker in under 5 minutes. All features, no limits, no license fees.",
    es: "Open Helpdesk es 100% open source bajo AGPL-3.0. Despliega en tus propios servidores con Docker en menos de 5 minutos. Todas las funcionalidades, sin límites, sin costo de licencia.",
  },
  "pricingPage.selfHosted.cta": { en: "View on GitHub", es: "Ver en GitHub" },
  "pricingPage.faq.heading": {
    en: "Pricing FAQ",
    es: "Preguntas sobre precios",
  },
  "pricingPage.faq.q1": {
    en: "Is there a free trial?",
    es: "Hay prueba gratuita?",
  },
  "pricingPage.faq.a1": {
    en: "Yes! Paid plans come with a 14-day free trial. No credit card required. If you don't upgrade, you're automatically moved to the Free plan — no data lost.",
    es: "Sí! Los planes de pago incluyen 14 días de prueba gratis. Sin tarjeta de crédito. Si no actualizas, pasas automáticamente al plan Free — sin perder datos.",
  },
  "pricingPage.faq.q2": {
    en: "What happens if I exceed my agent limit?",
    es: "Qué pasa si excedo mi límite de agentes?",
  },
  "pricingPage.faq.a2": {
    en: "You can purchase extra agent seats at $9/mo each without changing your plan. If you downgrade and exceed the limit, the most recently added agents become read-only — but no data is ever deleted.",
    es: "Puedes comprar asientos extra de agente a $9/mes cada uno sin cambiar de plan. Si bajas de plan y excedes el límite, los agentes más recientes pasan a solo lectura — pero nunca se borran datos.",
  },
  "pricingPage.faq.q3": {
    en: "Can I switch plans anytime?",
    es: "Puedo cambiar de plan en cualquier momento?",
  },
  "pricingPage.faq.a3": {
    en: "Yes. Upgrade instantly, downgrade at the end of your billing period. No lock-in contracts, no cancellation fees.",
    es: "Sí. Actualiza al instante, baja de plan al final de tu período de facturación. Sin contratos de permanencia, sin penalizaciones.",
  },
  "pricingPage.faq.q4": {
    en: "How does self-hosted pricing work?",
    es: "Cómo funciona el precio del self-hosted?",
  },
  "pricingPage.faq.a4": {
    en: "Self-hosted is completely free. The code is open source (AGPL-3.0) with no license fees, no feature restrictions, and no agent limits. You only pay for your own infrastructure.",
    es: "El self-hosted es completamente gratis. El código es open source (AGPL-3.0) sin costos de licencia, sin restricciones de funcionalidades y sin límites de agentes. Solo pagas tu propia infraestructura.",
  },
  "pricingPage.faq.q5": {
    en: "Why is Open Helpdesk so much cheaper?",
    es: "Por qué Open Helpdesk es mucho más barato?",
  },
  "pricingPage.faq.a5": {
    en: "We're open source and lean. No bloated sales teams, no enterprise upsells. We pass the savings to you. Simple software, simple pricing.",
    es: "Somos open source y eficientes. Sin equipos de ventas inflados, sin upsells enterprise. Te pasamos los ahorros a ti. Software simple, precios simples.",
  },

  // Compare - Index
  "compare.index.title": { en: "Open Helpdesk vs Competitors — Compare Helpdesk Software", es: "Open Helpdesk vs Competidores — Compara Software de Helpdesk" },
  "compare.index.headline": { en: "See how Open Helpdesk compares", es: "Mira cómo se compara Open Helpdesk" },
  "compare.index.subtitle": { en: "Detailed comparisons against popular helpdesk platforms. Open source, affordable, and built for growing teams.", es: "Comparaciones detalladas contra plataformas de helpdesk populares. Open source, accesible y creado para equipos en crecimiento." },
  "compare.index.cta": { en: "Compare", es: "Comparar" },

  // Compare - Shared
  "compare.section.atAGlance": { en: "At a Glance", es: "De un vistazo" },
  "compare.section.features": { en: "Feature Comparison", es: "Comparación de características" },
  "compare.section.whySwitch": { en: "Why Switch?", es: "¿Por qué cambiar?" },
  "compare.section.pricing": { en: "Pricing Comparison", es: "Comparación de precios" },
  "compare.section.faq": { en: "Frequently Asked Questions", es: "Preguntas frecuentes" },
  "compare.section.ourHighlights": { en: "Open Helpdesk", es: "Open Helpdesk" },
  "compare.section.theirPainPoints": { en: "Competitor", es: "Competidor" },
  "compare.shared.feat.cloudFree": { en: "Free plan included", es: "Plan gratuito incluido" },
  "compare.cta.tryFree": { en: "Try Open Helpdesk Free", es: "Prueba Open Helpdesk Gratis" },
  "compare.cta.viewGithub": { en: "View on GitHub", es: "Ver en GitHub" },
  "compare.pricing.feature": { en: "Feature", es: "Característica" },
  "compare.pricing.us": { en: "Open Helpdesk", es: "Open Helpdesk" },
  "compare.pricing.startingPrice": { en: "Starting Price", es: "Precio inicial" },
  "compare.pricing.perAgent": { en: "Per-agent pricing", es: "Precio por agente" },
  "compare.pricing.freeCloudPlan": { en: "Free cloud plan", es: "Plan cloud gratuito" },
  "compare.pricing.freeSelfHost": { en: "Free self-hosting", es: "Auto-hospedaje gratuito" },

  // Compare - Zendesk
  "compare.zendesk.name": { en: "Zendesk", es: "Zendesk" },
  "compare.zendesk.title": { en: "Open Helpdesk vs Zendesk — Open Source Alternative | Open Helpdesk", es: "Open Helpdesk vs Zendesk — Alternativa Open Source | Open Helpdesk" },
  "compare.zendesk.headline": { en: "The open-source Zendesk alternative that won't break the bank", es: "La alternativa open source a Zendesk que no arruinará tu presupuesto" },
  "compare.zendesk.subtitle": { en: "Everything you need from a helpdesk at a fraction of the cost. Open source, self-hostable, and built for growing teams.", es: "Todo lo que necesitas de un helpdesk a una fracción del costo. Open source, auto-hospedable y creado para equipos en crecimiento." },
  "compare.zendesk.description": { en: "Compare Open Helpdesk vs Zendesk. Open source helpdesk with tickets, SLA, CSAT, multi-workspace and self-hosting. Plans start free.", es: "Compara Open Helpdesk vs Zendesk. Helpdesk open source con tickets, SLA, CSAT, multi-workspace y auto-hospedaje. Planes desde gratis." },
  "compare.zendesk.ourHighlight.1": { en: "Free plan with unlimited tickets", es: "Plan gratuito con tickets ilimitados" },
  "compare.zendesk.ourHighlight.2": { en: "Plans with included seats + affordable extras", es: "Planes con asientos incluidos + extras económicos" },
  "compare.zendesk.ourHighlight.3": { en: "Open source — self-host or use our cloud", es: "Open source — auto-hospeda o usa nuestra nube" },
  "compare.zendesk.ourHighlight.4": { en: "Multi-workspace included from Starter", es: "Multi-workspace incluido desde Starter" },
  "compare.zendesk.ourHighlight.5": { en: "Modern, clean UI — no bloat", es: "Interfaz moderna y limpia — sin complejidad" },
  "compare.zendesk.theirPain.1": { en: "Starts at $55/agent/month (Suite Team)", es: "Desde $55/agente/mes (Suite Team)" },
  "compare.zendesk.theirPain.2": { en: "Per-agent pricing gets expensive fast", es: "El precio por agente se vuelve caro rápidamente" },
  "compare.zendesk.theirPain.3": { en: "Proprietary — no self-hosting option", es: "Propietario — sin opción de auto-hospedaje" },
  "compare.zendesk.theirPain.4": { en: "Complex interface with steep learning curve", es: "Interfaz compleja con curva de aprendizaje pronunciada" },
  "compare.zendesk.theirPain.5": { en: "Vendor lock-in — hard to migrate away", es: "Dependencia del proveedor — difícil de migrar" },
  "compare.zendesk.feat.cloudHosted": { en: "Cloud Hosted", es: "Alojamiento en la nube" },
  "compare.zendesk.feat.multiWorkspace": { en: "From $89/agent (Growth)", es: "Desde $89/agente (Growth)" },
  "compare.zendesk.feat.kanban": { en: "Kanban Board", es: "Tablero Kanban" },
  "compare.zendesk.feat.sla": { en: "From $89/agent (Growth)", es: "Desde $89/agente (Growth)" },
  "compare.zendesk.feat.csat": { en: "From $89/agent (Growth)", es: "Desde $89/agente (Growth)" },
  "compare.zendesk.feat.portal": { en: "From $89/agent (Growth)", es: "Desde $89/agente (Growth)" },
  "compare.zendesk.feat.auditLog": { en: "Enterprise only ($169/agent)", es: "Solo Enterprise ($169/agente)" },
  "compare.zendesk.feat.modernUi": { en: "Modern UI", es: "Interfaz moderna" },
  "compare.zendesk.diff.pricing.title": { en: "10x more affordable", es: "10 veces más económico" },
  "compare.zendesk.diff.pricing.desc": { en: "Zendesk Suite starts at $55/agent/month ($89 for SLA and CSAT). Open Helpdesk plans include seats with affordable extras. Self-host is completely free.", es: "Zendesk Suite empieza en $55/agente/mes ($89 para SLA y CSAT). Los planes de Open Helpdesk incluyen asientos con extras económicos. Auto-hospedaje es completamente gratis." },
  "compare.zendesk.diff.opensource.title": { en: "Open source, no lock-in", es: "Open source, sin dependencia" },
  "compare.zendesk.diff.opensource.desc": { en: "Full AGPL source code on GitHub. Self-host on your infrastructure, fork it, extend it. Your data, your rules.", es: "Código fuente AGPL completo en GitHub. Auto-hospeda en tu infraestructura, haz fork, extiéndelo. Tus datos, tus reglas." },
  "compare.zendesk.diff.workspace.title": { en: "Multi-workspace built-in", es: "Multi-workspace integrado" },
  "compare.zendesk.diff.workspace.desc": { en: "Manage multiple clients or teams with isolated workspaces. Perfect for MSPs and agencies. Included from the Starter plan.", es: "Gestiona múltiples clientes o equipos con workspaces aislados. Perfecto para MSPs y agencias. Incluido desde el plan Starter." },
  "compare.zendesk.diff.simplicity.title": { en: "Simple by design", es: "Simple por diseño" },
  "compare.zendesk.diff.simplicity.desc": { en: "No bloated features you'll never use. Clean interface your team can learn in minutes, not weeks.", es: "Sin funciones innecesarias que nunca usarás. Interfaz limpia que tu equipo puede aprender en minutos, no semanas." },
  "compare.zendesk.theirPricing": { en: "$55–169/agent/month (Suite)", es: "$55–169/agente/mes (Suite)" },
  "compare.zendesk.ourPricing": { en: "Free plan available. Paid from $15/month with seats included.", es: "Plan gratuito disponible. Pago desde $15/mes con asientos incluidos." },
  "compare.zendesk.faq.migration.q": { en: "Can I migrate from Zendesk to Open Helpdesk?", es: "¿Puedo migrar de Zendesk a Open Helpdesk?" },
  "compare.zendesk.faq.migration.a": { en: "Yes. You can export your tickets from Zendesk and import them into Open Helpdesk. Our team can assist with migration for Business plan customers.", es: "Sí. Puedes exportar tus tickets de Zendesk e importarlos en Open Helpdesk. Nuestro equipo puede asistir con la migración para clientes del plan Business." },
  "compare.zendesk.faq.pricing.q": { en: "How much cheaper is Open Helpdesk vs Zendesk?", es: "¿Cuánto más barato es Open Helpdesk vs Zendesk?" },
  "compare.zendesk.faq.pricing.a": { en: "Significantly. Zendesk Suite Team starts at $55/agent/month (billed annually). For features like SLA and CSAT, you need Suite Growth at $89/agent/month. Open Helpdesk offers a free plan, and paid plans start at $15/month with seats included. For a team of 10 agents, you'd pay $550+/month on Zendesk vs $39/month on Open Helpdesk Business.", es: "Significativamente. Zendesk Suite Team empieza en $55/agente/mes (facturación anual). Para funciones como SLA y CSAT, necesitas Suite Growth a $89/agente/mes. Open Helpdesk ofrece plan gratuito, y los planes pagos empiezan en $15/mes con asientos incluidos. Para un equipo de 10 agentes, pagarías $550+/mes en Zendesk vs $39/mes en Open Helpdesk Business." },
  "compare.zendesk.faq.features.q": { en: "Does Open Helpdesk have the same features as Zendesk?", es: "¿Tiene Open Helpdesk las mismas funciones que Zendesk?" },
  "compare.zendesk.faq.features.a": { en: "Open Helpdesk covers the core helpdesk features: tickets, email-to-ticket, SLA tracking, CSAT surveys, canned responses, custom fields, reports, and multi-workspace. Zendesk has additional features like live chat and phone support, but at a much higher price point.", es: "Open Helpdesk cubre las funciones principales: tickets, email-to-ticket, SLA tracking, encuestas CSAT, respuestas predefinidas, campos personalizados, reportes y multi-workspace. Zendesk tiene funciones adicionales como chat en vivo y soporte telefónico, pero a un precio mucho mayor." },
  "compare.zendesk.faq.selfhost.q": { en: "Can I self-host Open Helpdesk?", es: "¿Puedo auto-hospedar Open Helpdesk?" },
  "compare.zendesk.faq.selfhost.a": { en: "Yes. Open Helpdesk is fully open source (AGPL). Deploy it on your own servers with Docker in minutes. No agent limits, no feature restrictions. Zendesk offers no self-hosting option.", es: "Sí. Open Helpdesk es completamente open source (AGPL). Despliégalo en tus propios servidores con Docker en minutos. Sin límites de agentes ni restricciones de funciones. Zendesk no ofrece opción de auto-hospedaje." },
  "compare.zendesk.faq.reliability.q": { en: "Is Open Helpdesk reliable for production use?", es: "¿Es Open Helpdesk confiable para uso en producción?" },
  "compare.zendesk.faq.reliability.a": { en: "Yes. Open Helpdesk is used by teams in production today. Being open source means you're never locked in — if anything changes, you have full access to the code and your data.", es: "Sí. Open Helpdesk es usado por equipos en producción actualmente. Al ser open source, nunca estás atrapado — si algo cambia, tienes acceso completo al código y tus datos." },

  // Compare - osTicket
  "compare.osticket.name": { en: "osTicket", es: "osTicket" },
  "compare.osticket.title": { en: "Open Helpdesk vs osTicket — A Modern Open Source Helpdesk | Open Helpdesk", es: "Open Helpdesk vs osTicket — Un Helpdesk Open Source Moderno | Open Helpdesk" },
  "compare.osticket.headline": { en: "osTicket, but modern", es: "osTicket, pero moderno" },
  "compare.osticket.subtitle": { en: "Everything you love about open-source helpdesks, rebuilt with a modern interface, multi-workspace, and cloud hosting.", es: "Todo lo que amas de los helpdesks open source, reconstruido con interfaz moderna, multi-workspace y alojamiento en la nube." },
  "compare.osticket.description": { en: "Compare Open Helpdesk vs osTicket. Modern open-source helpdesk with multi-workspace, cloud hosting, SLA, CSAT, and a clean UI. Free forever.", es: "Compara Open Helpdesk vs osTicket. Helpdesk open source moderno con multi-workspace, alojamiento en la nube, SLA, CSAT e interfaz limpia. Gratis para siempre." },
  "compare.osticket.ourHighlight.1": { en: "Modern, responsive UI built with React", es: "Interfaz moderna y responsive construida con React" },
  "compare.osticket.ourHighlight.2": { en: "Multi-workspace for managing multiple clients", es: "Multi-workspace para gestionar múltiples clientes" },
  "compare.osticket.ourHighlight.3": { en: "Cloud hosted or self-hosted — your choice", es: "Alojamiento en la nube o auto-hospedado — tú eliges" },
  "compare.osticket.ourHighlight.4": { en: "Built-in CSAT surveys and Kanban boards", es: "Encuestas CSAT y tableros Kanban integrados" },
  "compare.osticket.ourHighlight.5": { en: "Active development with frequent updates", es: "Desarrollo activo con actualizaciones frecuentes" },
  "compare.osticket.theirPain.1": { en: "Dated interface from the early 2010s", es: "Interfaz anticuada de inicios de los 2010s" },
  "compare.osticket.theirPain.2": { en: "No multi-workspace — single tenant only", es: "Sin multi-workspace — solo un inquilino" },
  "compare.osticket.theirPain.3": { en: "Cloud option exists but per-agent pricing ($12-24/agent/mo)", es: "Opción cloud existe pero con precio por agente ($12-24/agente/mes)" },
  "compare.osticket.theirPain.4": { en: "No built-in CSAT surveys", es: "Sin encuestas CSAT integradas" },
  "compare.osticket.theirPain.5": { en: "PHP server-rendered UI (jQuery, no SPA framework)", es: "Interfaz PHP renderizada en servidor (jQuery, sin framework SPA)" },
  "compare.osticket.feat.cloudHosted": { en: "Cloud Hosted", es: "Alojamiento en la nube" },
  "compare.osticket.feat.cloudPaid": { en: "From $12/agent (SupportSystem)", es: "Desde $12/agente (SupportSystem)" },
  "compare.osticket.feat.kanban": { en: "Kanban Board", es: "Tablero Kanban" },
  "compare.osticket.feat.auditPremium": { en: "Cloud Premium only ($24/agent)", es: "Solo Cloud Premium ($24/agente)" },
  "compare.osticket.feat.modernUi": { en: "Modern UI", es: "Interfaz moderna" },
  "compare.osticket.diff.modernUi.title": { en: "Built for 2025, not 2012", es: "Construido para 2025, no para 2012" },
  "compare.osticket.diff.modernUi.desc": { en: "A clean, responsive interface built with React and Tailwind. Kanban boards, real-time updates, and a UX your team will actually enjoy using.", es: "Una interfaz limpia y responsive construida con React y Tailwind. Tableros Kanban, actualizaciones en tiempo real y una experiencia que tu equipo disfrutará usar." },
  "compare.osticket.diff.workspace.title": { en: "Multi-workspace native", es: "Multi-workspace nativo" },
  "compare.osticket.diff.workspace.desc": { en: "Manage multiple clients with isolated workspaces. Each client gets their own tickets, settings, and portal. osTicket is strictly single-tenant.", es: "Gestiona múltiples clientes con workspaces aislados. Cada cliente tiene sus propios tickets, configuración y portal. osTicket es estrictamente de un solo inquilino." },
  "compare.osticket.diff.hosting.title": { en: "Simpler cloud, simpler self-host", es: "Cloud más simple, self-host más simple" },
  "compare.osticket.diff.hosting.desc": { en: "Both offer cloud and self-hosting. But Open Helpdesk's cloud includes a free plan, and self-hosting is one Docker command. osTicket cloud starts at $12/agent/month, and self-hosting requires a LAMP stack setup.", es: "Ambos ofrecen nube y auto-hospedaje. Pero la nube de Open Helpdesk incluye un plan gratuito, y auto-hospedar es un solo comando Docker. La nube de osTicket empieza en $12/agente/mes, y auto-hospedar requiere configurar un stack LAMP." },
  "compare.osticket.diff.builtIn.title": { en: "CSAT, Kanban & more built-in", es: "CSAT, Kanban y más integrados" },
  "compare.osticket.diff.builtIn.desc": { en: "CSAT surveys, Kanban boards, and audit log are built into Open Helpdesk — features osTicket doesn't offer. Both have SLA tracking and canned responses.", es: "Encuestas CSAT, tableros Kanban y registro de auditoría están integrados en Open Helpdesk — funciones que osTicket no ofrece. Ambos tienen SLA tracking y respuestas predefinidas." },
  "compare.osticket.theirPricing": { en: "Free (self-host only), $12/agent/month (cloud)", es: "Gratis (solo auto-hospedaje), $12/agente/mes (nube)" },
  "compare.osticket.ourPricing": { en: "Free plan available. Paid from $15/month with seats included. Self-host free forever.", es: "Plan gratuito disponible. Pago desde $15/mes con asientos incluidos. Auto-hospedaje gratis para siempre." },
  "compare.osticket.faq.migration.q": { en: "Can I migrate from osTicket to Open Helpdesk?", es: "¿Puedo migrar de osTicket a Open Helpdesk?" },
  "compare.osticket.faq.migration.a": { en: "Yes. Both systems use standard ticketing concepts, so migration is straightforward. Export your tickets from osTicket and import them into Open Helpdesk.", es: "Sí. Ambos sistemas usan conceptos de ticketing estándar, por lo que la migración es directa. Exporta tus tickets de osTicket e impórtalos en Open Helpdesk." },
  "compare.osticket.faq.differences.q": { en: "What are the main differences between Open Helpdesk and osTicket?", es: "¿Cuáles son las diferencias principales entre Open Helpdesk y osTicket?" },
  "compare.osticket.faq.differences.a": { en: "Open Helpdesk offers a modern React UI, multi-workspace support, CSAT surveys, and Kanban boards — features osTicket lacks. Both have SLA tracking, canned responses, and email-to-ticket. osTicket has a dated PHP interface and is single-tenant only.", es: "Open Helpdesk ofrece interfaz moderna en React, soporte multi-workspace, encuestas CSAT y tableros Kanban — funciones que osTicket no tiene. Ambos tienen SLA tracking, respuestas predefinidas y email-to-ticket. osTicket tiene interfaz PHP anticuada y es solo single-tenant." },
  "compare.osticket.faq.hosting.q": { en: "Does Open Helpdesk also support self-hosting like osTicket?", es: "¿Open Helpdesk también soporta auto-hospedaje como osTicket?" },
  "compare.osticket.faq.hosting.a": { en: "Yes. Open Helpdesk is fully open source (AGPL) and can be self-hosted with a single Docker command. Both Open Helpdesk and osTicket offer cloud hosting, but Open Helpdesk includes a free cloud plan while osTicket's cloud (SupportSystem) starts at $12/agent/month.", es: "Sí. Open Helpdesk es completamente open source (AGPL) y se puede auto-hospedar con un solo comando Docker. Tanto Open Helpdesk como osTicket ofrecen alojamiento en la nube, pero Open Helpdesk incluye un plan cloud gratuito mientras que la nube de osTicket (SupportSystem) empieza en $12/agente/mes." },
  "compare.osticket.faq.features.q": { en: "Does Open Helpdesk have all the features osTicket has?", es: "¿Tiene Open Helpdesk todas las funciones de osTicket?" },
  "compare.osticket.faq.features.a": { en: "Yes, and more. Both share core features like tickets, email-to-ticket, SLA tracking, canned responses, and custom fields. Open Helpdesk adds multi-workspace, CSAT surveys, Kanban boards, and a modern React UI — features osTicket doesn't have.", es: "Sí, y más. Ambos comparten funciones principales como tickets, email-to-ticket, SLA tracking, respuestas predefinidas y campos personalizados. Open Helpdesk agrega multi-workspace, encuestas CSAT, tableros Kanban e interfaz moderna en React — funciones que osTicket no tiene." },
  "compare.osticket.faq.community.q": { en: "Is Open Helpdesk actively maintained?", es: "¿Se mantiene activamente Open Helpdesk?" },
  "compare.osticket.faq.community.a": { en: "Yes. Open Helpdesk is under active development with frequent releases. The full source code is on GitHub, and the community is growing.", es: "Sí. Open Helpdesk está en desarrollo activo con lanzamientos frecuentes. El código fuente completo está en GitHub y la comunidad está creciendo." },

  // Legal pages shared
  "legal.backToHome": { en: "Back to home", es: "Volver al inicio" },
} as const;

export type TranslationKey = keyof typeof translations;
export default translations;
