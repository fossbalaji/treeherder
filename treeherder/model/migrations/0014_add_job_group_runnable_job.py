# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-07-03 18:18
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('model', '0013_add_job_group_to_jobs'),
    ]

    operations = [
        migrations.AddField(
            model_name='runnablejob',
            name='job_group',
            field=models.ForeignKey(default=2, on_delete=django.db.models.deletion.CASCADE, to='model.JobGroup'),
        ),
    ]
