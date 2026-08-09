bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strlen

strlen:
    xor     rax, rax          ; Initialize counter to 0
    jmp     check_next_char   ; Goes to the loop the loop

check_next_char:
    cmp     [rdi], byte 0    ; Check if the current character is null (end of string)
    je      end_strlen       ; If null, end the loop
    inc     rdi              ; increment the pointer
    inc     rax              ; increment the counter
    jmp     check_next_char  ; Continue the loop

end_strlen:
    ret                      ; Return return the counter
