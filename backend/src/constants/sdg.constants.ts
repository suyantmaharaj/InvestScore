export interface SDGMeta {
  id:        number;
  code:      string;
  name:      string;
  shortName: string;
  color:     string;
}

export const SDG_LIST: SDGMeta[] = [
  { id: 1,  code: 'SDG1',  name: 'No Poverty',                              shortName: 'No Poverty',              color: '#E5243B' },
  { id: 2,  code: 'SDG2',  name: 'Zero Hunger',                             shortName: 'Zero Hunger',             color: '#DDA63A' },
  { id: 3,  code: 'SDG3',  name: 'Good Health and Well-being',              shortName: 'Good Health',             color: '#4C9F38' },
  { id: 4,  code: 'SDG4',  name: 'Quality Education',                       shortName: 'Education',               color: '#C5192D' },
  { id: 5,  code: 'SDG5',  name: 'Gender Equality',                         shortName: 'Gender Equality',         color: '#FF3A21' },
  { id: 6,  code: 'SDG6',  name: 'Clean Water and Sanitation',              shortName: 'Clean Water',             color: '#26BDE2' },
  { id: 7,  code: 'SDG7',  name: 'Affordable and Clean Energy',             shortName: 'Clean Energy',            color: '#FCC30B' },
  { id: 8,  code: 'SDG8',  name: 'Decent Work and Economic Growth',         shortName: 'Decent Work',             color: '#A21942' },
  { id: 9,  code: 'SDG9',  name: 'Industry, Innovation and Infrastructure', shortName: 'Innovation',              color: '#FD6925' },
  { id: 10, code: 'SDG10', name: 'Reduced Inequalities',                    shortName: 'Reduced Inequalities',    color: '#DD1367' },
  { id: 11, code: 'SDG11', name: 'Sustainable Cities and Communities',      shortName: 'Sustainable Cities',      color: '#FD9D24' },
  { id: 12, code: 'SDG12', name: 'Responsible Consumption and Production',  shortName: 'Responsible Consumption', color: '#BF8B2E' },
  { id: 13, code: 'SDG13', name: 'Climate Action',                          shortName: 'Climate Action',          color: '#3F7E44' },
  { id: 14, code: 'SDG14', name: 'Life Below Water',                        shortName: 'Life Below Water',        color: '#0A97D9' },
  { id: 15, code: 'SDG15', name: 'Life on Land',                            shortName: 'Life on Land',            color: '#56C02B' },
  { id: 16, code: 'SDG16', name: 'Peace, Justice and Strong Institutions',  shortName: 'Peace & Justice',         color: '#00689D' },
  { id: 17, code: 'SDG17', name: 'Partnerships for the Goals',              shortName: 'Partnerships',            color: '#19486A' },
];

export const getSDG = (id: number): SDGMeta | undefined =>
  SDG_LIST.find(s => s.id === id);
