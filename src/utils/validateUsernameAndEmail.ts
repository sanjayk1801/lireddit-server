import { FieldError } from "src/types/graphql/FieldError"

export const validateUsernameAndEmail = (username: string, email: string): FieldError[] | null => {
    if(username.includes("@")){
        return [{field: "username", message: "username should not contain @"}]

    }
    if(!email.includes('@')){
        return [{field: "email", message: "not a valid email"}]
    }
    return null

}