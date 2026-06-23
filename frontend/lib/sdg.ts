export interface SDG {
  id:        number;
  name:      string;
  shortName: string;
  color:     string;
  icon:      string;
}

export const SDG_LIST: SDG[] = [
  { id: 1,  name: 'No Poverty',                              shortName: 'No Poverty',             color: '#E5243B', icon: '🏠' },
  { id: 2,  name: 'Zero Hunger',                             shortName: 'Zero Hunger',            color: '#DDA63A', icon: '🌾' },
  { id: 3,  name: 'Good Health and Well-Being',              shortName: 'Good Health',            color: '#4C9F38', icon: '❤️' },
  { id: 4,  name: 'Quality Education',                       shortName: 'Quality Education',      color: '#C5192D', icon: '📚' },
  { id: 5,  name: 'Gender Equality',                         shortName: 'Gender Equality',        color: '#FF3A21', icon: '⚧️' },
  { id: 6,  name: 'Clean Water and Sanitation',              shortName: 'Clean Water',            color: '#26BDE2', icon: '💧' },
  { id: 7,  name: 'Affordable and Clean Energy',             shortName: 'Clean Energy',           color: '#FCC30B', icon: '⚡' },
  { id: 8,  name: 'Decent Work and Economic Growth',         shortName: 'Decent Work',            color: '#A21942', icon: '💼' },
  { id: 9,  name: 'Industry, Innovation and Infrastructure', shortName: 'Innovation',             color: '#FD6925', icon: '🏗️' },
  { id: 10, name: 'Reduced Inequalities',                    shortName: 'Reduced Inequalities',   color: '#DD1367', icon: '⚖️' },
  { id: 11, name: 'Sustainable Cities and Communities',      shortName: 'Sustainable Cities',     color: '#FD9D24', icon: '🏙️' },
  { id: 12, name: 'Responsible Consumption and Production',  shortName: 'Responsible Consumption',color: '#BF8B2E', icon: '♻️' },
  { id: 13, name: 'Climate Action',                          shortName: 'Climate Action',         color: '#3F7E44', icon: '🌍' },
  { id: 14, name: 'Life Below Water',                        shortName: 'Life Below Water',       color: '#0A97D9', icon: '🌊' },
  { id: 15, name: 'Life on Land',                            shortName: 'Life on Land',           color: '#56C02B', icon: '🌿' },
  { id: 16, name: 'Peace, Justice and Strong Institutions',  shortName: 'Peace & Justice',        color: '#00689D', icon: '⚖️' },
  { id: 17, name: 'Partnerships for the Goals',              shortName: 'Partnerships',           color: '#19486A', icon: '🤝' },
];

export const getSDG = (id: number): SDG | undefined =>
  SDG_LIST.find(s => s.id === id);

export const CLASSIFICATION_COLORS = {
  High:   { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  Medium: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  Low:    { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

export const CLASSIFICATION_LABELS = {
  High:   'High Impact',
  Medium: 'Medium Impact',
  Low:    'Low Impact',
};
