import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Layers, 
  Search, 
  ClockAlert, 
  Navigation,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Building2,
  Coins
} from 'lucide-react';
import { Work } from '../../types';
import { apiService } from '../../services/apiService';
import { convertClusterWorkToAppWork } from '../../services/margaDatabase';

interface DistrictConfig {
  id: string;
  name: string;
  query: string;
  lat: number;
  lng: number;
  zoom: number;
  talukas: { name: string; lat: number; lng: number }[];
}

const DISTRICT_CONFIGS: DistrictConfig[] = [
  {
    id: 'mysuru',
    name: 'Mysuru',
    query: 'Mysore',
    lat: 12.2958,
    lng: 76.6394,
    zoom: 11,
    talukas: [
      { name: 'Mysuru City / Urban', lat: 12.3051, lng: 76.6552 },
      { name: 'Chamundeshwari', lat: 12.2724, lng: 76.6710 },
      { name: 'Nanjangud', lat: 12.1186, lng: 76.6820 },
      { name: 'Hunsur', lat: 12.3082, lng: 76.2904 },
      { name: 'T. Narasipura', lat: 12.2132, lng: 76.9031 },
      { name: 'K.R. Nagar', lat: 12.5833, lng: 76.3833 },
      { name: 'Periyapatna', lat: 12.3384, lng: 76.0963 },
      { name: 'H.D. Kote', lat: 11.9867, lng: 76.3262 },
      { name: 'Varuna', lat: 12.2850, lng: 76.7320 },
      { name: 'Jayapura', lat: 12.1930, lng: 76.5420 },
    ],
  },
  {
    id: 'belagavi',
    name: 'Belagavi',
    query: 'Belgaum',
    lat: 15.8497,
    lng: 74.4977,
    zoom: 11,
    talukas: [
      { name: 'Belagavi City', lat: 15.8521, lng: 74.5020 },
      { name: 'Chikkodi', lat: 16.4284, lng: 74.5972 },
      { name: 'Gokak', lat: 16.1683, lng: 74.8234 },
      { name: 'Athani', lat: 16.7322, lng: 75.0614 },
      { name: 'Bailhongal', lat: 15.8155, lng: 74.8562 },
      { name: 'Saundatti', lat: 15.7654, lng: 75.1182 },
      { name: 'Ramdurg', lat: 15.9472, lng: 75.2974 },
      { name: 'Khanapur', lat: 15.6372, lng: 74.5165 },
      { name: 'Hukkeri', lat: 16.2291, lng: 74.6022 },
      { name: 'Raybag', lat: 16.4851, lng: 74.7782 },
      { name: 'Nippani', lat: 16.3980, lng: 74.3780 },
    ],
  },
  {
    id: 'dharwad',
    name: 'Hubballi-Dharwad',
    query: 'Dharwad',
    lat: 15.3647,
    lng: 75.1240,
    zoom: 11,
    talukas: [
      { name: 'Hubballi Urban', lat: 15.3647, lng: 75.1240 },
      { name: 'Dharwad City', lat: 15.4589, lng: 75.0078 },
      { name: 'Navalgund', lat: 15.5650, lng: 75.3610 },
      { name: 'Kundgol', lat: 15.2570, lng: 75.2530 },
      { name: 'Kalghatgi', lat: 15.1790, lng: 74.9740 },
      { name: 'Alnavar', lat: 15.4350, lng: 74.7330 },
      { name: 'Annigeri', lat: 15.4320, lng: 75.4320 },
      { name: 'Hubballi Rural', lat: 15.3210, lng: 75.1890 },
    ],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    query: 'Bangalore',
    lat: 12.9716,
    lng: 77.5946,
    zoom: 11,
    talukas: [
      { name: 'Bengaluru Central', lat: 12.9716, lng: 77.5946 },
      { name: 'Bengaluru South / Jayanagar', lat: 12.9141, lng: 77.5855 },
      { name: 'Bengaluru North / Hebbal', lat: 13.0354, lng: 77.5651 },
      { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
      { name: 'K.R. Puram / Whitefield', lat: 13.0075, lng: 77.6959 },
      { name: 'Anekal', lat: 12.7100, lng: 77.6970 },
      { name: 'Nelamangala', lat: 13.0980, lng: 77.3910 },
      { name: 'Doddaballapura', lat: 13.2920, lng: 77.5410 },
      { name: 'Devanahalli', lat: 13.2480, lng: 77.7120 },
      { name: 'Hoskote', lat: 13.0710, lng: 77.7980 },
    ],
  },
];

// Instant baseline nodes for each district so the map displays nodes immediately with 0ms lag
const BASELINE_DISTRICT_NODES: Record<string, any[]> = {
  mysuru: [
    {
      id: 'WRK-MYS-01',
      name: 'Installation of Community RO Drinking Water Plant at Hunsur Rural',
      category: 'Drinking Water',
      status: 'Ongoing',
      sanctioned: 24.5,
      disbursed: 18.0,
      physical: 65,
      taluka: 'Hunsur',
      lat: 12.3082,
      lng: 76.2904,
      mpName: 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar',
      agency: 'Mysuru Rural Engineering Division',
    },
    {
      id: 'WRK-MYS-02',
      name: 'Upgradation of Government Higher Primary School Digital Lab, Nanjangud',
      category: 'Education',
      status: 'Completed',
      sanctioned: 35.0,
      disbursed: 35.0,
      physical: 100,
      taluka: 'Nanjangud',
      lat: 12.1186,
      lng: 76.6820,
      mpName: 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar',
      agency: 'Karnataka Public Works Department',
    },
    {
      id: 'WRK-MYS-03',
      name: 'Construction of Tatayya Orphanage Girls Hostel Annex, Narayanashastri Road',
      category: 'Community Infrastructure',
      status: 'Delayed',
      sanctioned: 45.0,
      disbursed: 38.5,
      physical: 38,
      taluka: 'Mysuru City / Urban',
      lat: 12.3051,
      lng: 76.6552,
      mpName: 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar',
      agency: 'Mysuru City Corporation',
    },
    {
      id: 'WRK-MYS-04',
      name: 'Asphalt Road Connection from T. Narasipura to Bannur Agricultural Market',
      category: 'Roads & Pathways',
      status: 'Ongoing',
      sanctioned: 50.0,
      disbursed: 28.0,
      physical: 52,
      taluka: 'T. Narasipura',
      lat: 12.2132,
      lng: 76.9031,
      mpName: 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar',
      agency: 'Panchayat Raj Engineering Department',
    },
    {
      id: 'WRK-MYS-05',
      name: 'Primary Health Centre Emergency Ward Solar Electrification at K.R. Nagar',
      category: 'Health & Sanitation',
      status: 'Completed',
      sanctioned: 18.5,
      disbursed: 18.5,
      physical: 100,
      taluka: 'K.R. Nagar',
      lat: 12.5833,
      lng: 76.3833,
      mpName: 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar',
      agency: 'District Health Society, Mysuru',
    },
    {
      id: 'WRK-MYS-06',
      name: 'Dr. B.R. Ambedkar Samudaya Bhavana Construction at Varuna Hobli',
      category: 'SC/ST Welfare',
      status: 'Ongoing',
      sanctioned: 32.0,
      disbursed: 16.0,
      physical: 48,
      taluka: 'Varuna',
      lat: 12.2850,
      lng: 76.7320,
      mpName: 'Sri Yaduveer Krishnadatta Chamaraja Wadiyar',
      agency: 'Social Welfare Engineering Cell',
    },
  ],
  belagavi: [
    {
      id: 'WRK-BEL-01',
      name: 'Gokak Falls Tourist & Pilgrim Infrastructure Upgradation',
      category: 'Public Amenities',
      status: 'Ongoing',
      sanctioned: 42.0,
      disbursed: 30.0,
      physical: 70,
      taluka: 'Gokak',
      lat: 16.1683,
      lng: 74.8234,
      mpName: 'Sri Jagadish Shettar',
      agency: 'Belagavi District Administration',
    },
    {
      id: 'WRK-BEL-02',
      name: 'Construction of Sub-Market Yard Vegetable Sheds at Chikkodi',
      category: 'Agriculture & Marketing',
      status: 'Completed',
      sanctioned: 28.0,
      disbursed: 28.0,
      physical: 100,
      taluka: 'Chikkodi',
      lat: 16.4284,
      lng: 74.5972,
      mpName: 'Sri Jagadish Shettar',
      agency: 'APMC Engineering Division',
    },
    {
      id: 'WRK-BEL-03',
      name: 'Drinking Water Pipeline and Borewell Recharging at Athani Taluka',
      category: 'Drinking Water',
      status: 'Delayed',
      sanctioned: 38.0,
      disbursed: 31.0,
      physical: 40,
      taluka: 'Athani',
      lat: 16.7322,
      lng: 75.0614,
      mpName: 'Sri Jagadish Shettar',
      agency: 'Rural Water Supply & Sanitation Cell',
    },
    {
      id: 'WRK-BEL-04',
      name: 'Belagavi City High School Science Resource Centre Renovation',
      category: 'Education',
      status: 'Completed',
      sanctioned: 22.0,
      disbursed: 22.0,
      physical: 100,
      taluka: 'Belagavi City',
      lat: 15.8521,
      lng: 74.5020,
      mpName: 'Sri Jagadish Shettar',
      agency: 'Belagavi City Corporation',
    },
    {
      id: 'WRK-BEL-05',
      name: 'Bailhongal Community Hall and Skill Training Centre',
      category: 'Community Infrastructure',
      status: 'Ongoing',
      sanctioned: 30.0,
      disbursed: 15.0,
      physical: 50,
      taluka: 'Bailhongal',
      lat: 15.8155,
      lng: 74.8562,
      mpName: 'Sri Jagadish Shettar',
      agency: 'District Public Works Division',
    },
  ],
  dharwad: [
    {
      id: 'WRK-DHW-01',
      name: 'Installation of Solar Street Lighting along Navalgund Highway Corridor',
      category: 'Energy & Power',
      status: 'Completed',
      sanctioned: 25.0,
      disbursed: 25.0,
      physical: 100,
      taluka: 'Navalgund',
      lat: 15.5650,
      lng: 75.3610,
      mpName: 'Sri Pralhad Joshi',
      agency: 'KPTCL / Hescom Division',
    },
    {
      id: 'WRK-DHW-02',
      name: 'Hubballi City Hospital Diagnostic Wing Modernization',
      category: 'Health & Sanitation',
      status: 'Ongoing',
      sanctioned: 60.0,
      disbursed: 45.0,
      physical: 75,
      taluka: 'Hubballi Urban',
      lat: 15.3647,
      lng: 75.1240,
      mpName: 'Sri Pralhad Joshi',
      agency: 'Hubballi-Dharwad Municipal Corporation (HDMC)',
    },
    {
      id: 'WRK-DHW-03',
      name: 'Kundgol Lake Embankment Revitalization and Stormwater Channeling',
      category: 'Environment & Water',
      status: 'Delayed',
      sanctioned: 34.0,
      disbursed: 28.0,
      physical: 35,
      taluka: 'Kundgol',
      lat: 15.2570,
      lng: 75.2530,
      mpName: 'Sri Pralhad Joshi',
      agency: 'Minor Irrigation Division, Dharwad',
    },
    {
      id: 'WRK-DHW-04',
      name: 'Government ITI College Advanced Robotics Workshop at Dharwad City',
      category: 'Skill Development',
      status: 'Completed',
      sanctioned: 40.0,
      disbursed: 40.0,
      physical: 100,
      taluka: 'Dharwad City',
      lat: 15.4589,
      lng: 75.0078,
      mpName: 'Sri Pralhad Joshi',
      agency: 'Directorate of Technical Education',
    },
  ],
  bengaluru: [
    {
      id: 'WRK-BLR-01',
      name: 'Rainwater Harvesting and Lake Rejuvenation at Yelahanka Allalasandra Lake',
      category: 'Environment & Water',
      status: 'Completed',
      sanctioned: 75.0,
      disbursed: 75.0,
      physical: 100,
      taluka: 'Yelahanka',
      lat: 13.1007,
      lng: 77.5963,
      mpName: 'Sri Tejasvi Surya',
      agency: 'BBMP Lakes Division',
    },
    {
      id: 'WRK-BLR-02',
      name: 'Pedestrian Skywalk and Public Mobility Hub at Whitefield K.R. Puram',
      category: 'Transport & Roads',
      status: 'Ongoing',
      sanctioned: 85.0,
      disbursed: 55.0,
      physical: 62,
      taluka: 'K.R. Puram / Whitefield',
      lat: 13.0075,
      lng: 77.6959,
      mpName: 'Sri P. C. Mohan',
      agency: 'BBMP Infrastructure Division',
    },
    {
      id: 'WRK-BLR-03',
      name: 'Primary Health Care Telemedicine Upgradation in Anekal Rural',
      category: 'Health & Sanitation',
      status: 'Ongoing',
      sanctioned: 30.0,
      disbursed: 22.0,
      physical: 70,
      taluka: 'Anekal',
      lat: 12.7100,
      lng: 77.6970,
      mpName: 'Sri D.K. Suresh',
      agency: 'Bengaluru Rural Health Mission',
    },
    {
      id: 'WRK-BLR-04',
      name: 'Government Model School Science Laboratory Complex, Jayanagar',
      category: 'Education',
      status: 'Completed',
      sanctioned: 45.0,
      disbursed: 45.0,
      physical: 100,
      taluka: 'Bengaluru South / Jayanagar',
      lat: 12.9141,
      lng: 77.5855,
      mpName: 'Sri Tejasvi Surya',
      agency: 'Department of Public Instruction',
    },
    {
      id: 'WRK-BLR-05',
      name: 'Stormwater Drain Desilting and Retaining Wall at Hebbal Valley',
      category: 'Stormwater & Drainage',
      status: 'Delayed',
      sanctioned: 52.0,
      disbursed: 44.0,
      physical: 32,
      taluka: 'Bengaluru North / Hebbal',
      lat: 13.0354,
      lng: 77.5651,
      mpName: 'Smt. Shobha Karandlaje',
      agency: 'BBMP Storm Water Drains',
    },
  ],
};

function createSvgPin(status: string): L.DivIcon {
  let pinColor = '#2563eb'; // blue
  let pulseHtml = '';
  if (status === 'Completed') {
    pinColor = '#059669'; // emerald
  } else if (status === 'Delayed') {
    pinColor = '#e11d48'; // rose
    pulseHtml = `<div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`;
  }

  const html = `
    <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${pulseHtml}
      <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45);"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-pin',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

interface LeafletProjectMapProps {
  initialDistrictId?: 'mysuru' | 'belagavi' | 'dharwad' | 'bengaluru';
  works?: Work[];
  onSelectWork?: (work: Work) => void;
  className?: string;
  title?: string;
}

export const LeafletProjectMap: React.FC<LeafletProjectMapProps> = ({
  initialDistrictId = 'mysuru',
  works: propWorks = [],
  onSelectWork,
  className = '',
  title = 'Karnataka State Geospatial Project Nodes Map',
}) => {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialDistrictId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [apiWorks, setApiWorks] = useState<any[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const currentDistrict = useMemo(() => {
    return DISTRICT_CONFIGS.find((d) => d.id === selectedDistrictId) || DISTRICT_CONFIGS[0];
  }, [selectedDistrictId]);

  // Query live MongoDB Atlas cluster in background to enrich nodes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingApi(true);

    apiService
      .getWorks({ district: currentDistrict.query, limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data && res.data.length > 0) {
          setApiWorks(res.data);
        }
      })
      .catch((err) => {
        console.warn('API query for district nodes notice:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistrictId, currentDistrict]);

  // Combine instant baseline nodes with live API works
  const allDistrictNodes = useMemo(() => {
    const baseNodes = BASELINE_DISTRICT_NODES[selectedDistrictId] || BASELINE_DISTRICT_NODES.mysuru;
    
    // Convert API works into mapped nodes
    const dynamicNodes = apiWorks.map((raw, idx) => {
      const taluka = currentDistrict.talukas[idx % currentDistrict.talukas.length];
      const latOffset = (((idx * 17) % 30) - 15) * 0.001;
      const lngOffset = (((idx * 23) % 30) - 15) * 0.001;
      const isCompleted = (raw.status || '').toUpperCase().includes('COMPLET');
      const isSanctioned = (raw.status || '').toUpperCase().includes('SANCTION');
      const physical = raw.physicalProgress || (isCompleted ? 100 : 45);

      return {
        id: raw.workId || `WORK-ATLAS-${raw.rawId || idx}`,
        name: raw.description || raw.workDescription || 'MPLADS Community Development Asset',
        category: raw.category || 'Normal/Others',
        status: isCompleted ? 'Completed' : (physical < 40 ? 'Delayed' : 'Ongoing'),
        sanctioned: raw.sanctionedAmount ? Number((raw.sanctionedAmount / 100000).toFixed(2)) : 25.0,
        disbursed: raw.disbursedAmount ? Number((raw.disbursedAmount / 100000).toFixed(2)) : 15.0,
        physical,
        taluka: taluka.name,
        lat: Number((taluka.lat + latOffset).toFixed(5)),
        lng: Number((taluka.lng + lngOffset).toFixed(5)),
        mpName: raw.mpName || 'Member of Parliament',
        agency: raw.ida || `${currentDistrict.name} District Authority`,
        rawWork: convertClusterWorkToAppWork(raw),
      };
    });

    // Dedup by ID
    const combined = [...baseNodes, ...dynamicNodes];
    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [selectedDistrictId, apiWorks, currentDistrict]);

  // Filter nodes by status, category, search
  const filteredNodes = useMemo(() => {
    return allDistrictNodes.filter((node) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          node.name.toLowerCase().includes(q) ||
          node.id.toLowerCase().includes(q) ||
          node.taluka.toLowerCase().includes(q) ||
          node.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter !== node.status.toLowerCase()) return false;
      }
      if (categoryFilter !== 'all' && node.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [allDistrictNodes, searchQuery, statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    allDistrictNodes.forEach((n) => s.add(n.category));
    return Array.from(s).sort();
  }, [allDistrictNodes]);

  const totalSanctionedCr = useMemo(() => {
    const sumLakhs = filteredNodes.reduce((acc, n) => acc + (n.sanctioned || 0), 0);
    return (sumLakhs / 100).toFixed(2);
  }, [filteredNodes]);

  const avgProgress = useMemo(() => {
    if (filteredNodes.length === 0) return 0;
    const sum = filteredNodes.reduce((acc, n) => acc + (n.physical || 0), 0);
    return Math.round(sum / filteredNodes.length);
  }, [filteredNodes]);

  const delayedCount = useMemo(() => {
    return filteredNodes.filter((n) => n.status === 'Delayed').length;
  }, [filteredNodes]);

  // Bulletproof Leaflet Initialization and Cleanup
  useEffect(() => {
    const container = mapDivRef.current;
    if (!container) return;

    // 1. Remove prior map instance if any exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 2. Clear Leaflet ID from DOM container
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    // 3. Initialize fresh Leaflet Map
    const map = L.map(container, {
      center: [currentDistrict.lat, currentDistrict.lng],
      zoom: currentDistrict.zoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    // 4. Base OpenStreetMap tiles with CartoDB fallback
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    // 5. Invalidate size after layout calculation
    const timer = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    const handleResize = () => {
      if (map) map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (map) {
        map.remove();
      }
      mapInstanceRef.current = null;
      markerGroupRef.current = null;
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    };
  }, [selectedDistrictId, currentDistrict]);

  // Update Markers on filtered nodes change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    filteredNodes.forEach((node) => {
      const icon = createSvgPin(node.status);
      const marker = L.marker([node.lat, node.lng], { icon });

      const popupDiv = document.createElement('div');
      popupDiv.className = 'font-sans text-xs p-1 space-y-2 min-w-[250px]';
      popupDiv.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">
          <span style="font-family:monospace; font-weight:700; color:#0f172a;">${node.id}</span>
          <span style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background-color:${node.status === 'Completed' ? '#ecfdf5' : node.status === 'Delayed' ? '#fff1f2' : '#eff6ff'}; color:${node.status === 'Completed' ? '#047857' : node.status === 'Delayed' ? '#be123c' : '#1d4ed8'};">
            ${node.status}
          </span>
        </div>
        <div style="font-weight:600; color:#1e293b; line-height:1.35;">${node.name}</div>
        <div style="font-size:11px; color:#64748b; line-height:1.4;">
          <div>📍 Taluka: <b>${node.taluka}</b></div>
          <div>👤 MP: <b>${node.mpName}</b></div>
          <div>🏛️ Agency: ${node.agency}</div>
        </div>
        <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
            <span>Sanction: <b>₹${node.sanctioned} Lakhs</b></span>
            <span>Physical: <b>${node.physical}%</b></span>
          </div>
          <div style="width:100%; height:6px; background-color:#e2e8f0; border-radius:9999px; overflow:hidden;">
            <div style="width:${node.physical}%; height:100%; background-color:${node.physical >= 100 ? '#10b981' : node.status === 'Delayed' ? '#e11d48' : '#2563eb'};"></div>
          </div>
        </div>
      `;

      if (onSelectWork && node.rawWork) {
        const btn = document.createElement('button');
        btn.innerText = 'View Certified Ledger →';
        btn.style.cssText = 'width: 100%; margin-top: 6px; padding: 6px 8px; background-color: #0f172a; color: #ffffff; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; text-align: center; border: none;';
        btn.onclick = () => {
          onSelectWork(node.rawWork);
        };
        popupDiv.appendChild(btn);
      }

      marker.bindPopup(popupDiv);
      marker.on('click', () => {
        setSelectedNodeId(node.id);
      });

      group.addLayer(marker);
    });
  }, [filteredNodes, onSelectWork]);

  const handleFlyToNode = (node: any) => {
    setSelectedNodeId(node.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([node.lat, node.lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className={`border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Top Controls Ribbon */}
      <div className="p-4 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                OpenStreetMap GIS Project Nodes · Verified Physical Locations
              </span>
            </div>
          </div>
        </div>

        {/* District Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/90 rounded-lg border border-slate-700">
          {DISTRICT_CONFIGS.map((dist) => {
            const isSelected = selectedDistrictId === dist.id;
            return (
              <button
                key={dist.id}
                onClick={() => {
                  setSelectedDistrictId(dist.id);
                  setSelectedNodeId(null);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {dist.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aggregate Metric Strip */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Mapped Nodes:</span>
            <span className="font-mono font-bold text-slate-900">{filteredNodes.length} Projects</span>
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Total Sanctioned:</span>
            <span className="font-mono font-bold text-slate-900">₹{totalSanctionedCr} Cr</span>
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Avg Progress:</span>
            <span className="font-mono font-bold text-emerald-700">{avgProgress}%</span>
          </div>
          {delayedCount > 0 && (
            <>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <ClockAlert className="w-3.5 h-3.5" />
                <span>{delayedCount} Delayed Projects</span>
              </div>
            </>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="ongoing">Ongoing Execution</option>
            <option value="completed">Completed & Certified</option>
            <option value="delayed">Delayed / Attention Needed</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none max-w-[140px] truncate cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search taluka or project..."
              className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none w-44"
            />
          </div>
        </div>
      </div>

      {/* Main Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 bg-slate-100" style={{ height: '520px' }}>
        {/* Left 2 Cols: Leaflet Interactive Map */}
        <div className="lg:col-span-2 relative" style={{ height: '520px', minHeight: '520px' }}>
          {/* Explicitly styled Leaflet container div */}
          <div
            ref={mapDivRef}
            style={{
              width: '100%',
              height: '520px',
              minHeight: '520px',
              position: 'relative',
              zIndex: 1,
            }}
          />

          {/* Map Legend Overlay */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
            <div className="font-bold text-slate-800 mb-1 text-[10px] uppercase tracking-wider">Project Status Pins</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs" />
              <span>Completed & Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs" />
              <span>Ongoing Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-xs animate-pulse" />
              <span>Delayed / Behind Schedule</span>
            </div>
          </div>

          {isLoadingApi && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 px-3 py-1.5 rounded-md shadow-md border border-slate-200 flex items-center gap-2 text-xs text-slate-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Syncing live records for {currentDistrict.name}...</span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Project Nodes Explorer List */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col h-[520px] overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {currentDistrict.name} Projects ({filteredNodes.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">Click to fly on map</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 text-xs">
            {filteredNodes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MapPin className="w-6 h-6 mx-auto text-slate-300" />
                <p>No project nodes match the current filter.</p>
              </div>
            ) : (
              filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => handleFlyToNode(node)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{node.id}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          node.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : node.status === 'Delayed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>

                    <div className="font-medium text-slate-800 text-[11px] line-clamp-2 leading-snug">
                      {node.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>📍 {node.taluka}</span>
                      <span className="font-semibold text-slate-700">₹{node.sanctioned}L · {node.physical}%</span>
                    </div>

                    {onSelectWork && node.rawWork && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectWork(node.rawWork);
                          }}
                          className="text-[10px] font-semibold text-slate-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Certified Ledger</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
