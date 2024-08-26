/**
 * @template P
 * @param {(...p: P) => void} callback
 * @param {number} delay
 * @returns {(function(...P): void)|*}
 */
export function debounce(callback, delay){
    let timer;
    return function(){
        const args = arguments;
        const context = this;
        clearTimeout(timer);
        timer = setTimeout(function(){
            callback.apply(context, args);
        }, delay)
    }
}
