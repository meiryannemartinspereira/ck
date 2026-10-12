from enum import Enum


class ClassDay(str, Enum):
    SEGUNDA = "SEGUNDA"
    TERCA = "TERÇA"
    QUARTA = "QUARTA"
    QUINTA = "QUINTA"
    SEXTA = "SEXTA"
    SABADO = "SÁBADO"


class ClassTime(str, Enum):
    EIGHT_TO_TEN = "08-10"
    TEN_TO_TWELVE = "10-12"
    THIRTEEN_THIRTY = "13:30"
    SEVENTEEN_THIRTY = "17:30"


class ChecklistStatus(str, Enum):
    PENDENTE = "PENDENTE"
    PREENCHIDO = "PREENCHIDO"


class ChecklistOverallStatus(str, Enum):
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDO = "CONCLUIDO"