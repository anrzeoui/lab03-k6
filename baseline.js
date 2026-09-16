import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 20,
    duration: '1m',
};

export default function () {
    const base = 'http://localhost:3000';

    const cart = http.post(
        `${base}/cart/add`,
        null,
        { tags: { name: 'cart' } }
    );

    check(cart, {
        'cart status 200': (r) => r.status === 200,
    });

    sleep(1);
}
