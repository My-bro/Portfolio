bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strncmp

strncmp:
    xor     r10, r10
    xor     rax, rax              ; Initialize return value (starting address)
    mov     al,[rsi]
    cmp     [rdi], al
    jne     calculate_difference
    jmp     loop_next_char

incrementer:
    inc     rdi
    inc     rsi
    inc     r10
    jmp     loop_next_char

loop_next_char:
    cmp     byte [rdi], 0       ; Check if the current byte is null terminator
    je      calculate_difference         ; If so, check for equality
    cmp     r10, rdx
    jge     calculate_difference         ; Reached maximum characters to compare
    mov     al, [rdi]           ; Load the byte at [rdi] into AL register
    cmp     al, [rsi]           ; Compare the bytes
    jne     calculate_difference  ; If not equal, calculate difference
    jmp     incrementer         ; Continue loop

calculate_difference:
    movsx   rax, byte [rdi]     ; Sign-extend the byte from RDI into RAX
    movsx   r10, byte [rsi]     ; Sign-extend the byte from RSI into RDX
    sub     rax, r10            ; Calculate the signed difference
    ret

end_istrcmp:
    xor rax, rax
    ret
