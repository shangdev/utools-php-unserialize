declare module "locutus/php/var/serialize" {
  export default function serialize(value: any): string;
}

declare module "locutus/php/var/unserialize" {
  export default function unserialize(value: string): any;
}
