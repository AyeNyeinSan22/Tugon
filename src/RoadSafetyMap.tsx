import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from './LanguageProvider'

const BATANGAS_CITY: LatLngExpression = [13.7563, 121.0583]
const sampleHazards = [
  { point: [13.7538, 121.0601] as LatLngExpression, level: 'Danger', color: '#a12b2a', title: 'Sample hazard · Mabini Street', detail: 'Illustrative pothole report near the school gate.' },
  { point: [13.7591, 121.0527] as LatLngExpression, level: 'Caution', color: '#98620c', title: 'Sample caution · P. Burgos Street', detail: 'Illustrative drainage concern.' },
  { point: [13.7506, 121.0539] as LatLngExpression, level: 'Safe', color: '#2b744e', title: 'Sample segment · Rizal Avenue', detail: 'Illustrative segment with no active sample hazard.' },
]

function FollowCenter({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, 14, { duration: 0.8 }) }, [center, map])
  return null
}

export default function RoadSafetyMap() {
  const { t } = useLanguage()
  const [center, setCenter] = useState<LatLngExpression>(BATANGAS_CITY)
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(null)
  const [message, setMessage] = useState('Showing the Batangas City sample area. Markers and counts are illustrative.')

  const locateUser = () => {
    if (!navigator.geolocation) {
      setMessage('Location is unavailable in this browser. The map remains centered on Batangas City.')
      return
    }
    setMessage('Requesting your location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: LatLngExpression = [coords.latitude, coords.longitude]
        setUserPosition(position)
        setCenter(position)
        setMessage('Map centered on your current location. Safety pins remain sample data.')
      },
      () => setMessage('Location access was not available. The map remains centered on Batangas City.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return <div className="mt-5">
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-semibold text-[#153550]">{t('Batangas City, Philippines')}</p><p className="mt-0.5 text-xs text-[#516575]">{t('Sample map area · not live road-condition data')}</p></div>
      <button type="button" onClick={locateUser} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-md bg-[#176b70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10565a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b70] sm:self-auto">{t('Use my current location')}</button>
    </div>
    <div className="h-[290px] overflow-hidden rounded-lg border border-[#d5dee5] bg-[#eef2f5] sm:h-[370px]" role="region" aria-label="Road safety sample map centered on Batangas City">
      <MapContainer center={BATANGAS_CITY} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        <FollowCenter center={center}/>
        {sampleHazards.map((hazard) => <CircleMarker key={hazard.title} center={hazard.point} radius={9} pathOptions={{ color: '#ffffff', weight: 2, fillColor: hazard.color, fillOpacity: 1 }}>
          <Popup><strong>{hazard.title}</strong><br/>{hazard.detail}<br/><small>Fictional sample data</small></Popup>
        </CircleMarker>)}
        {userPosition && <CircleMarker center={userPosition} radius={9} pathOptions={{ className: 'map-current-marker', color: '#ffffff', weight: 3, fillColor: '#176b70', fillOpacity: 1 }}><Popup><strong>Your current location</strong><br/>Only used to center this map.</Popup></CircleMarker>}
      </MapContainer>
    </div>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#516575]" aria-label={t('Map legend')}>
        {[['#2b744e', 'Safe'], ['#98620c', 'Caution'], ['#a12b2a', 'Danger'], ...(userPosition ? [['#176b70', 'Your location']] : [])].map(([color, label]) => <span key={label} className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ backgroundColor: color }}/>{t(label)}</span>)}
      </div>
      <p className="text-xs text-[#516575]">{t('8 safe · 3 caution · 1 danger')} <span className="text-[#8998a5]">{t('(sample counts)')}</span></p>
    </div>
    <p className="mt-2 text-xs leading-5 text-[#516575]" aria-live="polite">{t(message)}</p>
  </div>
}
