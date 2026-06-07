export interface SDGMeta {
  id:        number;
  code:      string;
  name:      string;
  shortName: string;
  color:     string;   // Official UN SDG colour
  icon:      string;   // Emoji representation
}

export const SDG_LIST: SDGMeta[] = [
  { id: 1,  code: 'SDG1',  name: 'No Poverty',                              shortName: 'No Poverty',              color: '#E5243B', icon: '🏠' },
  { id: 2,  code: 'SDG2',  name: 'Zero Hunger',                             shortName: 'Zero Hunger',             color: '#DDA63A', icon: '🌾' },
  { id: 3,  code: 'SDG3',  name: 'Good Health and Well-being',              shortName: 'Good Health',             color: '#4C9F38', icon: '❤️' },
  { id: 4,  code: 'SDG4',  name: 'Quality Education',                       shortName: 'Education',               color: '#C5192D', icon: '📚' },
  { id: 5,  code: 'SDG5',  name: 'Gender Equality',                         shortName: 'Gender Equality',         color: '#FF3A21', icon: '⚧️' },
  { id: 6,  code: 'SDG6',  name: 'Clean Water and Sanitation',              shortName: 'Clean Water',             color: '#26BDE2', icon: '💧' },
  { id: 7,  code: 'SDG7',  name: 'Affordable and Clean Energy',             shortName: 'Clean Energy',            color: '#FCC30B', icon: '⚡' },
  { id: 8,  code: 'SDG8',  name: 'Decent Work and Economic Growth',         shortName: 'Decent Work',             color: '#A21942', icon: '💼' },
  { id: 9,  code: 'SDG9',  name: 'Industry, Innovation and Infrastructure', shortName: 'Innovation',              color: '#FD6925', icon: '🏗️' },
  { id: 10, code: 'SDG10', name: 'Reduced Inequalities',                    shortName: 'Reduced Inequalities',    color: '#DD1367', icon: '⚖️' },
  { id: 11, code: 'SDG11', name: 'Sustainable Cities and Communities',      shortName: 'Sustainable Cities',      color: '#FD9D24', icon: '🏙️' },
  { id: 12, code: 'SDG12', name: 'Responsible Consumption and Production',  shortName: 'Responsible Consumption', color: '#BF8B2E', icon: '♻️' },
  { id: 13, code: 'SDG13', name: 'Climate Action',                          shortName: 'Climate Action',          color: '#3F7E44', icon: '🌍' },
  { id: 14, code: 'SDG14', name: 'Life Below Water',                        shortName: 'Life Below Water',        color: '#0A97D9', icon: '🐟' },
  { id: 15, code: 'SDG15', name: 'Life on Land',                            shortName: 'Life on Land',            color: '#56C02B', icon: '🌿' },
  { id: 16, code: 'SDG16', name: 'Peace, Justice and Strong Institutions',  shortName: 'Peace & Justice',         color: '#00689D', icon: '☮️' },
  { id: 17, code: 'SDG17', name: 'Partnerships for the Goals',              shortName: 'Partnerships',            color: '#19486A', icon: '🤝' },
];

export const getSDG = (id: number): SDGMeta | undefined =>
  SDG_LIST.find(s => s.id === id);
