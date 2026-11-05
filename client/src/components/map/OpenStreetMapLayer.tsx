import { TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function OpenStreetMapLayer() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}
