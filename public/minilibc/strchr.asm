bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strchr

    strchr:
    xor     rax, rax             ; Initialize counter to 0
    cmp     byte [rdi], 0
    je      ret_null
    jmp     check_next_char      ; Jump to the first character check

check_next_char:
    cmp     byte[rdi], sil
    je      end_strchr
    cmp     byte [rdi], 0    ; Check if the current character is null (end of string)
    je      end_strchr       ; If null, end the loop
    inc     rdi              ; Move to the next character
    jmp     check_next_char  ; Continue the loop

end_strchr:
    mov rax, rdi
    ret

ret_null:
    mov     rax, 0
    ret