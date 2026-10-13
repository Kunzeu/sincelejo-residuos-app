export const CATEGORIES = [
  { id: 'Sólidos', hint: 'Bolsas, basura acumulada' },
  { id: 'Reciclables', hint: 'Plástico, cartón, vidrio' },
  { id: 'Orgánicos', hint: 'Restos de comida, poda' },
  { id: 'Escombros', hint: 'Obra, colchones, llantas' },
  { id: 'Peligrosos', hint: 'Pilas, aceite, químicos' },
];

export const CLEAN_POINTS = [
  { id: 'p1', title: 'Punto limpio Centro', detail: 'Plástico, cartón y papel', latitude: 9.3000, longitude: -75.3950 },
  { id: 'p2', title: 'Punto limpio Norte', detail: 'Vidrio y electrónicos pequeños', latitude: 9.3150, longitude: -75.3900 },
  { id: 'p3', title: 'Punto limpio Majagual', detail: 'Aceite de cocina y pilas', latitude: 9.2925, longitude: -75.4105 },
];

export const SCHEDULE = [
  { day: 'Lunes', zone: 'Centro y La Ford', waste: 'Sólidos' },
  { day: 'Martes', zone: 'Majagual y Venecia', waste: 'Sólidos' },
  { day: 'Miércoles', zone: 'Norte y Cruz de Mayo', waste: 'Reciclables' },
  { day: 'Jueves', zone: 'Sur y El Cortijo', waste: 'Sólidos' },
  { day: 'Viernes', zone: 'Oriente y Boston', waste: 'Orgánicos' },
  { day: 'Sábado', zone: 'Puntos limpios', waste: 'Especiales' },
];

export const GUIDE = [
  { title: 'Orgánicos', text: 'Cáscaras, sobras y poda van en bolsa verde. No mezcles líquidos.' },
  { title: 'Reciclables', text: 'Enjuaga botellas y aplasta cajas. El vidrio va aparte, sin tapas.' },
  { title: 'Rechazo', text: 'Lo que no se recicla ni se composta: pañales, icopor sucio, papel higiénico.' },
  { title: 'Peligrosos', text: 'Pilas, medicamentos y aceite no van a la caneca. Llévalos a un punto limpio.' },
];

export function reportCategory(report) {
  if (report?.category) return report.category;
  const match = String(report?.description || '').match(/^\[(.+?)\]\s*/);
  return match ? match[1] : 'General';
}

export function reportText(report) {
  if (report?.category) return report.description || '';
  return String(report?.description || '').replace(/^\[.+?\]\s*/, '');
}

export function statusLabel(status) {
  if (status === 'pending') return 'Pendiente';
  if (status === 'in_progress') return 'En ruta';
  if (status === 'resolved') return 'Resuelto';
  return status || 'Sin estado';
}

export function statusColors(status) {
  if (status === 'resolved') return { fg: '#0e7a45', bg: '#e7f6ee' };
  if (status === 'in_progress') return { fg: '#1d4ed8', bg: '#e8f0ff' };
  return { fg: '#b45309', bg: '#fff4e5' };
}

export function timeAgo(value) {
  if (!value) return 'Reciente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Reciente';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString();
}

export function levelFor(points) {
  if (points >= 100) return { name: 'Guardián', next: null, floor: 100 };
  if (points >= 50) return { name: 'Reciclador experto', next: 100, floor: 50 };
  if (points >= 10) return { name: 'Colaborador', next: 50, floor: 10 };
  return { name: 'Novato', next: 10, floor: 0 };
}

export function achievements(points, reportCount, resolvedCount) {
  return [
    { title: 'Primer reporte', done: reportCount >= 1, detail: 'Publica un hallazgo' },
    { title: 'Voz del barrio', done: reportCount >= 5, detail: 'Cinco reportes enviados' },
    { title: 'Ciudad más limpia', done: resolvedCount >= 1, detail: 'Un reporte tuyo fue resuelto' },
    { title: 'Guardián', done: points >= 100, detail: 'Llega a 100 eco-puntos' },
  ];
}
