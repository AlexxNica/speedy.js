export function isPrime(value: int) {
    if (value <= 1) {
        return false;
    }

    for (let i = 2; i <= (Math.sqrt(value) as int); ++i) {
        if (value % i === 0) {
            return false;
        }
    }
    return true;
}
