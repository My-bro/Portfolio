bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strstr

strstr:
    mov     al, [rsi]
    cmp     byte [rsi], 0        ; Check if the first byte is null terminator
    je      end_main_loop
    cmp     byte [rdi], 0        ; Check if the second byte is null terminator
    je      end_null
    jmp     loop_next_char

loop_next_char:
    cmp     byte [rdi], 0        ; Check if the current byte is null terminator
    je      end_main_loop        ; If so, end
    mov     al, [rdi]            ; Load the byte at [rdi] into AL register
    mov     r10, [rsi]
    cmp     al, [rsi]            ; Compare the bytes
    jne     incrementer          ; Continue loop
    mov     r11, rdi
    mov     rax, rdi
    mov     r12, rsi
    je      check_if_two_str_same

incrementer:
    inc     rdi
    jmp     loop_next_char


check_if_two_str_same:
    cmp     byte [r12], 0       ; Check if the current byte is null terminator
    je      end_true         ; If so, end
    cmp     byte [r11], 0       ; Check if the current byte is null terminator
    je      end_false        ; If so, end

    mov     r13b, [r11]
    cmp     r13b, [r12]
    je      incrementer_same_str
    inc     rdi
    jne     loop_next_char

incrementer_same_str:
    inc   r11
    inc   r12
    jmp   check_if_two_str_same

end_main_loop:
    mov rax, rdi
    ret

end_true:
    ret

end_false:
    inc rdi
    jmp loop_next_char

end_null:
    mov rax, 0
    ret