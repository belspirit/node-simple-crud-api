export interface User extends Object {
  name: string;
  id: string;
  age: number;
  hobbies: string[];
}

export const isUser = (arg: User): arg is User => {
  return (
    arg &&
    !!arg.name &&
    typeof arg.name === "string" &&
    !!arg.age &&
    typeof arg.age === "number" &&
    !!arg.id &&
    typeof arg.id === "string" &&
    Array.isArray(arg.hobbies) &&
    (!arg.hobbies.length || arg.hobbies.every((h) => typeof h === "string"))
  );
};
