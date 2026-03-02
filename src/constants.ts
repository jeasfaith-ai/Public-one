import { Department, ProjectContent, ProjectDetails } from './types';

export const DEPARTMENTS = Object.values(Department);

export const INITIAL_PROJECT_CONTENT: ProjectContent = {
  abstract: "",
  dedication: "",
  acknowledgement: "",
  tableOfContents: "",
  listOfTables: "",
  chapter1: "",
  chapter2: "",
  chapter3: "",
  chapter4: "",
  chapter5: "",
  references: "",
  appendices: ""
};

export const MOCK_TOPICS = [
  "The Impact of Digital Technology on Business Education in Nigeria",
  "Strategies for Improving Mathematics Performance in Secondary Schools",
  "The Role of Guidance Counsellors in Career Choice Among Undergraduates"
];
