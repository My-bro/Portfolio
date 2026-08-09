bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strrchr

strrchr:
    xor     rax, rax          ; Initialize counter to 0
    jmp     check_next_char   ; Jump to the first character check

is_equal:
    mov rax, rdi
    inc rdi
    jmp check_next_char

check_next_char:
    cmp     byte [rdi], sil
    je is_equal
    cmp     byte [rdi], 0    ; Check if the current character is null (end of string)
    je      end_strchr       ; If null, end the loop
    inc     rdi              ; Move to the next character
    jmp     check_next_char  ; Continue the loop

end_strchr:
    ret