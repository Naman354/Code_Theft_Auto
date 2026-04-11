import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '30s', target: 40 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  http.get('http://localhost:3000/api/submit');

  sleep(1);
}