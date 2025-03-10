import type { ScriptInput } from './_utils';

export type Args = {
  preventDefaultUncaughtError: boolean;
  preventDefaultUnhandledRejection: boolean;
};

export function main({
  args,
  utils: { replaceFunction, ReflectCached, replaceGetter },
}: ScriptInput<Args>) {
  if (args.preventDefaultUncaughtError) {
    self.addEventListener('error', preventDefault);
  }
  if (args.preventDefaultUnhandledRejection) {
    self.addEventListener('unhandledrejection', preventDefault);
  }

  function preventDefault(event: ErrorEvent | PromiseRejectionEvent) {
    let prevented = event.defaultPrevented;
    event.preventDefault();

    // Hide this, but make sure if they hide it we mimic normal behaviour
    replaceFunction(
      event,
      'preventDefault',
      (target, thisArg, argArray) => {
        // Will raise correct error if 'thisArg' is wrong
        ReflectCached.apply(target, thisArg, argArray);
        prevented = true;
      },
      { onlyForInstance: true },
    );
    replaceGetter(
      event,
      'defaultPrevented',
      (target, thisArg, argArray) => {
        ReflectCached.apply(target, thisArg, argArray);
        return prevented;
      },
      { onlyForInstance: true },
    );

    if (!('console' in self)) {
      return;
    }

    const error = event instanceof ErrorEvent ? event.error : event.reason;
    self.console.error(`Default ${event.type} event prevented, error:`, error);
  }
}
