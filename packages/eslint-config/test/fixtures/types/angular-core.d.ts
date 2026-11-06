// The slice of @angular/core the fixtures use, so type-aware rules see real types without installing Angular.
declare module '@angular/core' {
  export interface InputSignal<T> {
    (): T;
  }
  export interface OutputEmitterRef<T> {
    emit(value: T): void;
  }
  export function input<T>(): InputSignal<T | undefined>;
  export namespace input {
    function required<T>(): InputSignal<T>;
  }
  export function output<T>(): OutputEmitterRef<T>;
  export function inject<T>(token: abstract new (...args: never[]) => T): T;
  export function Component(metadata: object): ClassDecorator;
  export function Input(): PropertyDecorator;
  export function Output(): PropertyDecorator;
  export class EventEmitter<T> {
    emit(value: T): void;
  }
  export enum ChangeDetectionStrategy {
    OnPush = 0,
    Default = 1,
  }
}
